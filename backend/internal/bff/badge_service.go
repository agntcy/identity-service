// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package bff

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	badgecore "github.com/agntcy/identity-platform/internal/core/badge"
	badgea2a "github.com/agntcy/identity-platform/internal/core/badge/a2a"
	badgemcp "github.com/agntcy/identity-platform/internal/core/badge/mcp"
	badgetypes "github.com/agntcy/identity-platform/internal/core/badge/types"
	identitycore "github.com/agntcy/identity-platform/internal/core/identity"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	settingscore "github.com/agntcy/identity-platform/internal/core/settings"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/go-playground/validator/v10"
)

type issueInput struct {
	a2a struct {
		WellKnownUrl string `validate:"required"`
	}

	mcp struct {
		Name string `validate:"required"`
		Url  string `validate:"required"`
	}
}

type IssueOption func(in *issueInput)

func WithA2A(wellKnownUrl string) IssueOption {
	return func(in *issueInput) {
		in.a2a.WellKnownUrl = wellKnownUrl
	}
}

func WithMCP(name, url string) IssueOption {
	return func(in *issueInput) {
		in.mcp.Name = name
		in.mcp.Url = url
	}
}

type BadgeService interface {
	IssueBadge(
		ctx context.Context,
		appID string,
		options ...IssueOption,
	) (*badgetypes.Badge, error)
}

type badgeService struct {
	settingsRepository settingscore.Repository
	appRepository      appcore.Repository
	badgeRepository    badgecore.Repository
	validator          *validator.Validate
	a2aClient          badgea2a.DiscoveryClient
	mcpClient          badgemcp.DiscoveryClient
	keyStore           identitycore.KeyStore
	identityService    identitycore.Service
	credentialStore    idpcore.CredentialStore
}

func NewBadgeService(
	settingsRepository settingscore.Repository,
	appRepository appcore.Repository,
	badgeRepository badgecore.Repository,
	a2aClient badgea2a.DiscoveryClient,
	mcpClient badgemcp.DiscoveryClient,
	keyStore identitycore.KeyStore,
	identityService identitycore.Service,
	credentialStore idpcore.CredentialStore,
) BadgeService {
	return &badgeService{
		settingsRepository: settingsRepository,
		appRepository:      appRepository,
		badgeRepository:    badgeRepository,
		validator:          validator.New(validator.WithRequiredStructEnabled()),
		a2aClient:          a2aClient,
		mcpClient:          mcpClient,
		keyStore:           keyStore,
		identityService:    identityService,
		credentialStore:    credentialStore,
	}
}

func (s *badgeService) IssueBadge(
	ctx context.Context,
	appID string,
	options ...IssueOption,
) (*badgetypes.Badge, error) {
	settings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to get settings: %w", err)
	}

	app, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		return nil, fmt.Errorf("unable to get the application: %w", err)
	}

	var in issueInput
	for _, opt := range options {
		opt(&in)
	}

	claims, badgeType, err := s.createBadgeClaims(ctx, app, &in)
	if err != nil {
		return nil, err
	}

	privKey, err := s.keyStore.RetrievePrivKey(ctx, settings.KeyID)
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve private key: %w", err)
	}

	badge, err := badgecore.Issue(
		app.ID,
		settings.IssuerID,
		badgeType,
		claims,
		privKey,
	)
	if err != nil {
		return nil, fmt.Errorf("unable to issue badge: %w", err)
	}

	userID, _ := identitycontext.GetUserID(ctx)

	clientCredentials, err := s.credentialStore.Get(ctx, app.ID)
	if err != nil {
		return nil, fmt.Errorf("unable to fetch client credentials: %w", err)
	}

	err = s.identityService.PublishVerifiableCredential(
		ctx,
		clientCredentials,
		&badge.VerifiableCredential,
		&identitycore.Issuer{
			CommonName: settings.IssuerID,
			KeyID:      settings.KeyID,
		},
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("unable to publish the badge: %w", err)
	}

	err = s.badgeRepository.Create(ctx, badge)
	if err != nil {
		return nil, fmt.Errorf("unable to store the badge: %w", err)
	}

	return badge, nil
}

func (s *badgeService) createBadgeClaims(
	ctx context.Context,
	app *apptypes.App,
	in *issueInput,
) (*badgetypes.BadgeClaims, badgetypes.BadgeType, error) {
	claims := badgetypes.BadgeClaims{
		ID: app.ResolverMetadataID,
	}
	var badgeType badgetypes.BadgeType

	switch app.Type {
	case apptypes.APP_TYPE_AGENT_A2A:
		err := s.validator.Struct(&in.a2a)
		if err != nil {
			return nil, badgetypes.BADGE_TYPE_UNSPECIFIED, err
		}

		card, err := s.a2aClient.Discover(ctx, in.a2a.WellKnownUrl)
		if err != nil {
			return nil,
				badgetypes.BADGE_TYPE_UNSPECIFIED,
				fmt.Errorf("unable to discover A2A agent card: %w", err)
		}

		claims.Badge = card
		badgeType = badgetypes.BADGE_TYPE_AGENT_BADGE
	case apptypes.APP_TYPE_AGENT_OASF:
		// Add implementation for OASF
		return nil, 0, nil
	case apptypes.APP_TYPE_MCP_SERVER:
		err := s.validator.Struct(&in.mcp)
		if err != nil {
			return nil, badgetypes.BADGE_TYPE_UNSPECIFIED, err
		}

		mcpServer, err := s.mcpClient.Discover(ctx, in.mcp.Name, in.mcp.Url)
		if err != nil {
			return nil,
				badgetypes.BADGE_TYPE_UNSPECIFIED,
				fmt.Errorf("unable to discover MCP server: %w", err)
		}

		if mcpServer == nil {
			return nil,
				badgetypes.BADGE_TYPE_UNSPECIFIED,
				fmt.Errorf("no MCP server found")
		}

		// Marshal the MCP server to JSON
		mcpServerData, err := json.Marshal(mcpServer)
		if err != nil {
			return nil,
				badgetypes.BADGE_TYPE_UNSPECIFIED,
				fmt.Errorf("error marshalling MCP server: %w", err)
		}

		claims.Badge = string(mcpServerData)
		badgeType = badgetypes.BADGE_TYPE_MCP_BADGE
	default:
		return nil,
			badgetypes.BADGE_TYPE_UNSPECIFIED,
			errors.New("unsupported app type")
	}

	return &claims, badgeType, nil
}
