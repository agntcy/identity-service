// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package bff

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/go-playground/validator/v10"
	appcore "github.com/outshift/identity-service/internal/core/app"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	badgecore "github.com/outshift/identity-service/internal/core/badge"
	badgea2a "github.com/outshift/identity-service/internal/core/badge/a2a"
	badgemcp "github.com/outshift/identity-service/internal/core/badge/mcp"
	badgetypes "github.com/outshift/identity-service/internal/core/badge/types"
	identitycore "github.com/outshift/identity-service/internal/core/identity"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	settingscore "github.com/outshift/identity-service/internal/core/settings"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
)

type issueInput struct {
	a2a struct {
		WellKnownUrl *string `validate:"required_if=SchemaBase64 null"`
		SchemaBase64 *string `validate:"required_if=WellKnownUrl null"`
	}

	mcp struct {
		Name         *string `validate:"required_if=SchemaBase64 null"`
		Url          *string `validate:"required_if=SchemaBase64 null"`
		SchemaBase64 *string `validate:"required_if=Url null"`
	}

	oasf struct {
		SchemaBase64 string `validate:"required"`
	}
}

type IssueOption func(in *issueInput)

func WithA2A(wellKnownUrl, schemaBase64 *string) IssueOption {
	return func(in *issueInput) {
		in.a2a.WellKnownUrl = wellKnownUrl
		in.a2a.SchemaBase64 = schemaBase64
	}
}

func WithMCP(name, url, schemaBase64 *string) IssueOption {
	return func(in *issueInput) {
		in.mcp.Name = name
		in.mcp.Url = url
		in.mcp.SchemaBase64 = schemaBase64
	}
}

func WithOASF(schemaBase64 string) IssueOption {
	return func(in *issueInput) {
		in.oasf.SchemaBase64 = schemaBase64
	}
}

type BadgeService interface {
	IssueBadge(
		ctx context.Context,
		appID string,
		options ...IssueOption,
	) (*badgetypes.Badge, error)
	VerifyBadge(
		ctx context.Context,
		badge *string,
	) (*badgetypes.VerificationResult, error)
	GetBadge(
		ctx context.Context,
		appID string,
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
	taskService        policycore.TaskService
	badgeRevoker       badgecore.Revoker
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
	taskService policycore.TaskService,
	badgeRevoker badgecore.Revoker,
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
		taskService:        taskService,
		badgeRevoker:       badgeRevoker,
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

	clientCredentials, err := s.credentialStore.Get(ctx, app.ID)
	if err != nil {
		return nil, fmt.Errorf("unable to fetch client credentials: %w", err)
	}

	issuer := identitycore.Issuer{
		CommonName: settings.IssuerID,
		KeyID:      settings.KeyID,
	}

	err = s.identityService.PublishVerifiableCredential(
		ctx,
		clientCredentials,
		&badge.VerifiableCredential,
		&issuer,
	)
	if err != nil {
		return nil, fmt.Errorf("unable to publish the badge: %w", err)
	}

	err = s.createTasks(ctx, app, claims)
	if err != nil {
		return nil, err
	}

	// revoke all active badges
	err = s.badgeRevoker.RevokeAll(ctx, app.ID, clientCredentials, &issuer, privKey)
	if err != nil {
		return nil, fmt.Errorf("unable to revoke current badges: %w", err)
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

		var a2aClaims string

		if in.a2a.WellKnownUrl != nil {
			a2aClaims, err = s.a2aClient.Discover(ctx, *in.a2a.WellKnownUrl)
			if err != nil {
				return nil,
					badgetypes.BADGE_TYPE_UNSPECIFIED,
					fmt.Errorf("unable to discover A2A agent card: %w", err)
			}
		} else {
			a2aSchema, err := base64.StdEncoding.DecodeString(*in.a2a.SchemaBase64)
			if err != nil {
				return nil, badgetypes.BADGE_TYPE_AGENT_BADGE, err
			}

			a2aClaims = string(a2aSchema)
		}

		claims.Badge = a2aClaims
		badgeType = badgetypes.BADGE_TYPE_AGENT_BADGE
	case apptypes.APP_TYPE_AGENT_OASF:
		err := s.validator.Struct(&in.oasf)
		if err != nil {
			return nil, badgetypes.BADGE_TYPE_AGENT_BADGE, err
		}

		oasfSchema, err := base64.StdEncoding.DecodeString(in.oasf.SchemaBase64)
		if err != nil {
			return nil, badgetypes.BADGE_TYPE_AGENT_BADGE, err
		}

		// see how you can validate the OASF schema
		// https://schema.oasf.agntcy.org/doc/index.html#/Validation/SchemaWeb_SchemaController_validate_object

		claims.Badge = string(oasfSchema)
		badgeType = badgetypes.BADGE_TYPE_AGENT_BADGE
	case apptypes.APP_TYPE_MCP_SERVER:
		err := s.validator.Struct(&in.mcp)
		if err != nil {
			return nil, badgetypes.BADGE_TYPE_UNSPECIFIED, err
		}

		var mcpClaims string

		if in.mcp.Name != nil && in.mcp.Url != nil {
			mcpServer, err := s.mcpClient.AutoDiscover(ctx, *in.mcp.Name, *in.mcp.Url)
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

			mcpClaims = string(mcpServerData)
		} else if in.mcp.SchemaBase64 != nil {
			mcpSchema, err := base64.StdEncoding.DecodeString(*in.mcp.SchemaBase64)
			if err != nil {
				return nil, badgetypes.BADGE_TYPE_UNSPECIFIED, err
			}

			mcpClaims = string(mcpSchema)
		}

		claims.Badge = mcpClaims
		badgeType = badgetypes.BADGE_TYPE_MCP_BADGE
	default:
		return nil,
			badgetypes.BADGE_TYPE_UNSPECIFIED,
			errors.New("unsupported app type")
	}

	return &claims, badgeType, nil
}

func (s *badgeService) createTasks(
	ctx context.Context,
	app *apptypes.App,
	claims *badgetypes.BadgeClaims,
) error {
	switch app.Type {
	case apptypes.APP_TYPE_AGENT_A2A, apptypes.APP_TYPE_AGENT_OASF:
		_, err := s.taskService.UpdateOrCreateForAgent(ctx, app.ID, ptrutil.DerefStr(app.Name))
		if err != nil {
			return fmt.Errorf("error trying to create tasks: %w", err)
		}
	case apptypes.APP_TYPE_MCP_SERVER:
		_, err := s.taskService.CreateForMCP(ctx, app.ID, claims.Badge)
		if err != nil {
			return fmt.Errorf("error trying to create tasks: %w", err)
		}
	}

	return nil
}

func (s *badgeService) VerifyBadge(
	ctx context.Context,
	badge *string,
) (*badgetypes.VerificationResult, error) {
	if badge == nil {
		return nil, errors.New("badge or verifiable credential is empty")
	}

	// Use the identity service to verify the VC
	return s.identityService.VerifyVerifiableCredential(
		ctx,
		badge,
	)
}

func (s *badgeService) GetBadge(
	ctx context.Context,
	appID string,
) (*badgetypes.Badge, error) {
	badge, err := s.badgeRepository.GetLatestByAppID(ctx, appID)
	if err != nil {
		return nil, err
	}

	return badge, nil
}
