// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package bff

import (
	"context"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	identitycore "github.com/agntcy/identity-platform/internal/core/identity"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	settingscore "github.com/agntcy/identity-platform/internal/core/settings"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	outshiftiam "github.com/agntcy/identity-platform/internal/pkg/iam"
	"github.com/agntcy/identity-platform/pkg/log"
	"github.com/google/uuid"
)

type AppService interface {
	CreateApp(ctx context.Context, app *apptypes.App) (*apptypes.App, error)
	GetApp(ctx context.Context, id string) (*apptypes.App, error)
}

type appService struct {
	appRepository      appcore.Repository
	settingsRepository settingscore.Repository
	identityService    identitycore.Service
	idpFactory         idpcore.IdpFactory
	credentialStore    idpcore.CredentialStore
	iamClient          outshiftiam.Client
}

func NewAppService(
	appRepository appcore.Repository,
	settingsRepository settingscore.Repository,
	identityService identitycore.Service,
	idpFactory idpcore.IdpFactory,
	credentialStore idpcore.CredentialStore,
	iamClient outshiftiam.Client,
) AppService {
	return &appService{
		appRepository:      appRepository,
		settingsRepository: settingsRepository,
		identityService:    identityService,
		idpFactory:         idpFactory,
		credentialStore:    credentialStore,
		iamClient:          iamClient,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	app *apptypes.App,
) (createdApp *apptypes.App, err error) {
	if app == nil {
		return nil, errutil.Err(nil, "app cannot be nil")
	}

	if app.Type == apptypes.APP_TYPE_UNSPECIFIED {
		return nil, errutil.Err(nil, "app type is required")
	}

	issSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return nil, errutil.Err(err, "unable to fetch settings")
	}

	var clientCredentials *idpcore.ClientCredentials
	var idp idpcore.Idp

	idp, err = s.idpFactory.Create(ctx, issSettings)
	if err != nil {
		return nil, errutil.Err(err, "failed to create IDP instance")
	}

	clientCredentials, err = idp.CreateClientCredentialsPair(ctx)
	if err != nil {
		return nil, errutil.Err(err, "failed to create client credentials pair")
	}

	defer func() {
		// Clean up client credentials if they were created.
		if err != nil && clientCredentials != nil {
			_ = idp.DeleteClientCredentialsPair(ctx, clientCredentials)
		}
	}()

	userID, _ := identitycontext.GetUserID(ctx)

	resolverMetadataID, err := s.identityService.GenerateID(
		ctx,
		clientCredentials,
		&identitycore.Issuer{
			CommonName: issSettings.IssuerID,
			KeyID:      issSettings.KeyID,
		},
		userID,
	)
	if err != nil {
		return nil, err
	}

	app.ID = uuid.NewString()
	app.ResolverMetadataID = resolverMetadataID

	err = s.credentialStore.Put(ctx, clientCredentials, app.ID)
	if err != nil {
		return nil, errutil.Err(err, "unable to store client credentials")
	}

	apiKey, err := s.iamClient.CreateAppApiKey(ctx, app.ID)
	if err != nil {
		return nil, errutil.Err(err, "failed to generate an api key")
	}

	createdApp, err = s.appRepository.CreateApp(ctx, app)
	if err != nil {
		return nil, err
	}

	app.ApiKey = apiKey.Secret

	return createdApp, nil
}

func (s *appService) GetApp(
	ctx context.Context,
	id string,
) (*apptypes.App, error) {
	if id == "" {
		return nil, errutil.Err(nil, "app ID cannot be empty")
	}

	app, err := s.appRepository.GetApp(ctx, id)
	if err != nil {
		return nil, err
	}

	apiKey, err := s.iamClient.GetAppApiKey(ctx, app.ID)
	if err != nil {
		log.Warn(err)
	}

	app.ApiKey = apiKey.Secret

	return app, nil
}
