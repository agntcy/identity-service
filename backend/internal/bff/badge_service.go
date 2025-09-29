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
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/pkg/log"
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
		return nil, fmt.Errorf("repository in IssueBadge failed to fetch settings: %w", err)
	}

	app, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		if errors.Is(err, appcore.ErrAppNotFound) {
			return nil, errutil.NotFound("badge.appNotFound", "Application not found.")
		}

		return nil, fmt.Errorf("repository in IssueBadge failed to get the application: %w", err)
	}

	var in issueInput
	for _, opt := range options {
		opt(&in)
	}

	claims, badgeType, err := s.createBadgeClaims(ctx, app, &in)
	if err != nil {
		return nil, err
	}

	log.FromContext(ctx).Debug("Creating badge with claims: ", claims)

	privKey, err := s.keyStore.RetrievePrivKey(ctx, settings.KeyID)
	if err != nil {
		return nil, fmt.Errorf(
			"key store in IssueBadge failed to retrieve private key (%s): %w",
			settings.KeyID,
			err,
		)
	}

	log.FromContext(ctx).Debug("Using private key: ", privKey)

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

	log.FromContext(ctx).Debug("Issued badge: ", badge)

	clientCredentials, err := s.credentialStore.Get(ctx, app.ID)
	if err != nil {
		return nil, fmt.Errorf("unable to get client credentials in IssueBadge for app %s: %w", app.ID, err)
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
		return nil, fmt.Errorf("identity service failed to publish the badge: %w", err)
	}

	err = s.createTasks(ctx, app, claims)
	if err != nil {
		return nil, err
	}

	// revoke all active badges
	err = s.badgeRevoker.RevokeAll(ctx, app.ID, clientCredentials, &issuer, privKey)
	if err != nil {
		return nil, fmt.Errorf("unable to revoke current badges for app %s: %w", app.ID, err)
	}

	err = s.badgeRepository.Create(ctx, badge)
	if err != nil {
		return nil, fmt.Errorf("repository in IssueBadge failed to store the badge: %w", err)
	}

	return badge, nil
}

func (s *badgeService) createBadgeClaims(
	ctx context.Context,
	app *apptypes.App,
	in *issueInput,
) (*badgetypes.BadgeClaims, badgetypes.BadgeType, error) {
	var claims *badgetypes.BadgeClaims

	var badgeType badgetypes.BadgeType

	var err error

	switch app.Type {
	case apptypes.APP_TYPE_AGENT_A2A:
		claims, err = s.createA2ABadgeClaims(ctx, in)
		badgeType = badgetypes.BADGE_TYPE_AGENT_BADGE
	case apptypes.APP_TYPE_AGENT_OASF:
		claims, err = s.createOASFBadgeClaims(ctx, in)
		badgeType = badgetypes.BADGE_TYPE_AGENT_BADGE
	case apptypes.APP_TYPE_MCP_SERVER:
		claims, err = s.createMCPBadgeClaims(ctx, in)
		badgeType = badgetypes.BADGE_TYPE_MCP_BADGE
	default:
		return nil,
			badgetypes.BADGE_TYPE_UNSPECIFIED,
			errutil.InvalidRequest("badge.appTypeNotSupported", "Unsupported application type.")
	}

	if err != nil {
		return nil, badgetypes.BADGE_TYPE_UNSPECIFIED, err
	}

	return &badgetypes.BadgeClaims{
		ID:    app.ResolverMetadataID,
		Badge: claims.Badge,
	}, badgeType, nil
}

func (s *badgeService) createA2ABadgeClaims(
	ctx context.Context,
	in *issueInput,
) (*badgetypes.BadgeClaims, error) {
	err := s.validator.Struct(&in.a2a)
	if err != nil {
		return nil, err
	}

	var a2aClaims string

	if in.a2a.WellKnownUrl != nil {
		a2aClaims, err = s.a2aClient.Discover(ctx, *in.a2a.WellKnownUrl)
		if err != nil {
			log.FromContext(ctx).
				WithError(err).
				Errorf("a2a client failed to discover agent card (%s)", *in.a2a.WellKnownUrl)

			return nil, errutil.InvalidRequest(
				"badge.a2aDiscoveryFailed",
				"Unable to discover A2A agent card (%s).",
				*in.a2a.WellKnownUrl,
			)
		}
	} else {
		a2aSchema, err := base64.StdEncoding.DecodeString(*in.a2a.SchemaBase64)
		if err != nil {
			log.FromContext(ctx).WithError(err).Warn("unable to decode in.a2a.SchemaBase64")

			return nil, errutil.InvalidRequest("badge.invalidSchemaBase64", "Unable to decode SchemaBase64.")
		}

		a2aClaims = string(a2aSchema)
	}

	return &badgetypes.BadgeClaims{
		Badge: a2aClaims,
	}, nil
}

func (s *badgeService) createOASFBadgeClaims(ctx context.Context, in *issueInput) (*badgetypes.BadgeClaims, error) {
	err := s.validator.Struct(&in.oasf)
	if err != nil {
		return nil, err
	}

	oasfSchema, err := base64.StdEncoding.DecodeString(in.oasf.SchemaBase64)
	if err != nil {
		log.FromContext(ctx).WithError(err).Warn("unable to decode in.oasf.SchemaBase64")

		return nil, errutil.InvalidRequest("badge.invalidSchemaBase64", "Unable to decode SchemaBase64.")
	}

	// see how you can validate the OASF schema
	// https://schema.oasf.agntcy.org/doc/index.html#/Validation/SchemaWeb_SchemaController_validate_object

	return &badgetypes.BadgeClaims{
		Badge: string(oasfSchema),
	}, nil
}

func (s *badgeService) createMCPBadgeClaims(
	ctx context.Context,
	in *issueInput,
) (*badgetypes.BadgeClaims, error) {
	err := s.validator.Struct(&in.mcp)
	if err != nil {
		return nil, err
	}

	var mcpClaims string

	if in.mcp.Name != nil && in.mcp.Url != nil {
		mcpServer, err := s.mcpClient.AutoDiscover(ctx, *in.mcp.Name, *in.mcp.Url)
		if err != nil {
			log.FromContext(ctx).
				WithError(err).
				Errorf("mcp client failed to auto discover the server (%s)", *in.mcp.Url)

			return nil, errutil.InvalidRequest(
				"badge.mcpDiscoveryFailed",
				"Unable to discover MCP server (%s).",
				*in.mcp.Url,
			)
		}

		if mcpServer == nil {
			return nil, errutil.InvalidRequest("badge.mcpServerNotFound", "No MCP server found (%s).", *in.mcp.Url)
		}

		// Marshal the MCP server to JSON
		mcpServerData, err := json.Marshal(mcpServer)
		if err != nil {
			return nil, fmt.Errorf("error marshalling MCP server (%s): %w", *in.mcp.Url, err)
		}

		mcpClaims = string(mcpServerData)
	} else if in.mcp.SchemaBase64 != nil {
		mcpSchema, err := base64.StdEncoding.DecodeString(*in.mcp.SchemaBase64)
		if err != nil {
			log.FromContext(ctx).WithError(err).Warn("unable to decode in.mcp.SchemaBase64")

			return nil, errutil.InvalidRequest("badge.invalidSchemaBase64", "Unable to decode SchemaBase64.")
		}

		mcpClaims = string(mcpSchema)
	}

	return &badgetypes.BadgeClaims{
		Badge: mcpClaims,
	}, nil
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
			return fmt.Errorf("error trying to create tasks for agent %s: %w", app.ID, err)
		}
	case apptypes.APP_TYPE_MCP_SERVER:
		_, err := s.taskService.CreateForMCP(ctx, app.ID, claims.Badge)
		if err != nil {
			return fmt.Errorf("error trying to create tasks for MCP server %s: %w", app.ID, err)
		}
	}

	return nil
}

func (s *badgeService) VerifyBadge(
	ctx context.Context,
	badge *string,
) (*badgetypes.VerificationResult, error) {
	if badge == nil || *badge == "" {
		return nil, errutil.ValidationFailed("badge.emptyBadge", "Badge or Verifiable Credential is empty")
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
	if appID == "" {
		return nil, errutil.ValidationFailed("badge.invalidAppID", "Invalid application ID.")
	}

	badge, err := s.badgeRepository.GetLatestByAppIdOrResolverMetadataID(ctx, appID)
	if err != nil {
		if errors.Is(err, badgecore.ErrBadgeNotFound) {
			return nil, errutil.NotFound("badge.notFound", "No badge found for the application.")
		}

		return nil, fmt.Errorf("repository in GetBadge failed to fetch latest badge for app %s: %w", appID, err)
	}

	return badge, nil
}
