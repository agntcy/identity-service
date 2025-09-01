// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"testing"

	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/bff"
	appmocks "github.com/outshift/identity-service/internal/core/app/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	badgea2amocks "github.com/outshift/identity-service/internal/core/badge/a2a/mocks"
	"github.com/outshift/identity-service/internal/core/badge/mcp"
	badgemcpmocks "github.com/outshift/identity-service/internal/core/badge/mcp/mocks"
	badgemocks "github.com/outshift/identity-service/internal/core/badge/mocks"
	badgetypes "github.com/outshift/identity-service/internal/core/badge/types"
	identitycore "github.com/outshift/identity-service/internal/core/identity"
	identitymocks "github.com/outshift/identity-service/internal/core/identity/mocks"
	"github.com/outshift/identity-service/internal/core/idp"
	idpmocks "github.com/outshift/identity-service/internal/core/idp/mocks"
	policymocks "github.com/outshift/identity-service/internal/core/policy/mocks"
	settingsmocks "github.com/outshift/identity-service/internal/core/settings/mocks"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// IssueBadge

type issueBadgeSuccessFixture struct {
	ctx          context.Context //nolint:containedctx // to simplify the test cases
	app          *apptypes.App
	settingsRepo *settingsmocks.Repository
	appRepo      *appmocks.Repository
	keyStore     *identitymocks.KeyStore
	credStore    *idpmocks.CredentialStore
	identityServ *identitymocks.Service
	tasksServ    *policymocks.TaskService
	badgeRevoker *badgemocks.Revoker
	badgeRepo    *badgemocks.Repository
}

func initTestServiceIssueBadgeSuccessFixture(t *testing.T) *issueBadgeSuccessFixture {
	t.Helper()

	ctx := context.Background()
	issSettings := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
		KeyID:    uuid.NewString(),
	}
	issuer := &identitycore.Issuer{
		CommonName: issSettings.IssuerID,
		KeyID:      issSettings.KeyID,
	}
	app := &apptypes.App{
		ID: uuid.NewString(),
	}

	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issSettings, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, app.ID).Return(app, nil)

	keyStore := identitymocks.NewKeyStore(t)
	keyStore.EXPECT().
		RetrievePrivKey(ctx, issSettings.KeyID).
		RunAndReturn(func(ctx context.Context, id string) (*jwk.Jwk, error) {
			privKey, _ := joseutil.GenerateJWK("RS256", "sig", issSettings.KeyID)
			return privKey, nil
		})

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Get(ctx, app.ID).Return(&idp.ClientCredentials{}, nil)

	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().PublishVerifiableCredential(
		ctx,
		mock.Anything,
		mock.Anything,
		issuer,
	).Return(nil)

	tasksServ := policymocks.NewTaskService(t)
	tasksServ.EXPECT().UpdateOrCreateForAgent(ctx, app.ID, ptrutil.DerefStr(app.Name)).Return(nil, nil)

	badgeRevoker := badgemocks.NewRevoker(t)
	badgeRevoker.EXPECT().RevokeAll(ctx, app.ID, mock.Anything, issuer, mock.Anything).Return(nil)

	badgeRepo := badgemocks.NewRepository(t)
	badgeRepo.EXPECT().Create(ctx, mock.Anything).Return(nil)

	return &issueBadgeSuccessFixture{
		ctx:          ctx,
		app:          app,
		settingsRepo: settingsRepo,
		appRepo:      appRepo,
		keyStore:     keyStore,
		credStore:    credStore,
		identityServ: identityServ,
		tasksServ:    tasksServ,
		badgeRevoker: badgeRevoker,
		badgeRepo:    badgeRepo,
	}
}

//nolint:funlen // a handful of tests cases
func TestBadgeService_IssueBadge_should_succeed(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		options    bff.IssueOption
		appType    apptypes.AppType
		sutFactory func(t *testing.T, fixture *issueBadgeSuccessFixture) bff.BadgeService
		claims     string
	}{
		"issue A2A badge from a base64 schema": {
			options: bff.WithA2A(nil, ptrutil.Ptr("YTJhX2FnZW50")), // base64 value is a2a_agent
			appType: apptypes.APP_TYPE_AGENT_A2A,
			claims:  "a2a_agent",
			sutFactory: func(t *testing.T, fixture *issueBadgeSuccessFixture) bff.BadgeService {
				t.Helper()

				return bff.NewBadgeService(
					fixture.settingsRepo,
					fixture.appRepo,
					fixture.badgeRepo,
					nil,
					nil,
					fixture.keyStore,
					fixture.identityServ,
					fixture.credStore,
					fixture.tasksServ,
					fixture.badgeRevoker,
				)
			},
		},
		"issue A2A badge from a well-known URL": {
			options: bff.WithA2A(ptrutil.Ptr("agent_card_wellknown_url"), nil),
			appType: apptypes.APP_TYPE_AGENT_A2A,
			claims:  "a2a_agent",
			sutFactory: func(t *testing.T, fixture *issueBadgeSuccessFixture) bff.BadgeService {
				t.Helper()

				a2aClient := badgea2amocks.NewDiscoveryClient(t)
				a2aClient.EXPECT().Discover(fixture.ctx, mock.Anything).Return("a2a_agent", nil)

				return bff.NewBadgeService(
					fixture.settingsRepo,
					fixture.appRepo,
					fixture.badgeRepo,
					a2aClient,
					nil,
					fixture.keyStore,
					fixture.identityServ,
					fixture.credStore,
					fixture.tasksServ,
					fixture.badgeRevoker,
				)
			},
		},
		"issue OASF badge": {
			options: bff.WithOASF("b2FzZl9hZ2VudA=="), // base64 value is oasf_agent
			appType: apptypes.APP_TYPE_AGENT_OASF,
			claims:  "oasf_agent",
			sutFactory: func(t *testing.T, fixture *issueBadgeSuccessFixture) bff.BadgeService {
				t.Helper()

				return bff.NewBadgeService(
					fixture.settingsRepo,
					fixture.appRepo,
					fixture.badgeRepo,
					nil,
					nil,
					fixture.keyStore,
					fixture.identityServ,
					fixture.credStore,
					fixture.tasksServ,
					fixture.badgeRevoker,
				)
			},
		},
		"issue MCP Server badge using server": {
			options: bff.WithMCP(ptrutil.Ptr("mcp_server"), ptrutil.Ptr("mcp_url"), nil),
			appType: apptypes.APP_TYPE_MCP_SERVER,
			claims:  `{"name":"mcp_server","url":""}`,
			sutFactory: func(t *testing.T, fixture *issueBadgeSuccessFixture) bff.BadgeService {
				t.Helper()

				mcpClient := badgemcpmocks.NewDiscoveryClient(t)
				mcpClient.EXPECT().
					AutoDiscover(fixture.ctx, mock.Anything, mock.Anything).
					Return(&mcp.McpServer{Name: "mcp_server"}, nil)

				fixture.tasksServ.EXPECT().
					CreateForMCP(fixture.ctx, fixture.app.ID, mock.Anything).
					Return(nil, nil)

				return bff.NewBadgeService(
					fixture.settingsRepo,
					fixture.appRepo,
					fixture.badgeRepo,
					nil,
					mcpClient,
					fixture.keyStore,
					fixture.identityServ,
					fixture.credStore,
					fixture.tasksServ,
					fixture.badgeRevoker,
				)
			},
		},
		"issue MCP Server badge base64 schema": {
			options: bff.WithMCP(nil, nil, ptrutil.Ptr("eyJuYW1lIjoibWNwX3NlcnZlciIsInVybCI6IiJ9")), // base64 of the claims
			appType: apptypes.APP_TYPE_MCP_SERVER,
			claims:  `{"name":"mcp_server","url":""}`,
			sutFactory: func(t *testing.T, fixture *issueBadgeSuccessFixture) bff.BadgeService {
				t.Helper()

				fixture.tasksServ.EXPECT().CreateForMCP(fixture.ctx, fixture.app.ID, mock.Anything).Return(nil, nil)

				return bff.NewBadgeService(
					fixture.settingsRepo,
					fixture.appRepo,
					fixture.badgeRepo,
					nil,
					nil,
					fixture.keyStore,
					fixture.identityServ,
					fixture.credStore,
					fixture.tasksServ,
					fixture.badgeRevoker,
				)
			},
		},
	}

	fixture := initTestServiceIssueBadgeSuccessFixture(t)

	//nolint:paralleltest // running the tests in parallel will cause memory issues
	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			fixture.app.Type = tc.appType
			sut := tc.sutFactory(t, fixture)

			badge, err := sut.IssueBadge(fixture.ctx, fixture.app.ID, tc.options)

			assert.NoError(t, err)
			assert.Equal(t, &badgetypes.BadgeClaims{Badge: tc.claims}, badge.CredentialSubject)
		})
	}
}

// VerifyBadge

func TestBadgeService_VerifyBadge_should_not_return_an_error(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	validBadge := "valid_badge"
	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().VerifyVerifiableCredential(ctx, &validBadge).Return(&badgetypes.VerificationResult{}, nil)
	sut := bff.NewBadgeService(nil, nil, nil, nil, nil, nil, identityServ, nil, nil, nil)

	_, err := sut.VerifyBadge(ctx, &validBadge)

	assert.NoError(t, err)
}

func TestBadgeService_VerifyBadge_should_return_err_when_badge_is_null(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	sut := bff.NewBadgeService(nil, nil, nil, nil, nil, nil, nil, nil, nil, nil)

	_, err := sut.VerifyBadge(ctx, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "badge or verifiable credential is empty")
}
