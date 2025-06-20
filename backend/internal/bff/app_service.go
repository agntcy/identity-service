// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package bff

import (
	"context"
	"errors"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	identitycore "github.com/agntcy/identity-platform/internal/core/identity"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	settingscore "github.com/agntcy/identity-platform/internal/core/settings"
	settingstypes "github.com/agntcy/identity-platform/internal/core/settings/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

type AppService interface {
	CreateApp(ctx context.Context, app *apptypes.App) (*apptypes.App, error)
	GetApp(ctx context.Context, id string) (*apptypes.App, error)
}

type appService struct {
	appRepository      appcore.Repository
	settingsRepository settingscore.Repository
	identityService    identitycore.Service
}

func NewAppService(
	appRepository appcore.Repository,
	settingsRepository settingscore.Repository,
	identityService identitycore.Service,
) AppService {
	return &appService{
		appRepository:      appRepository,
		settingsRepository: settingsRepository,
		identityService:    identityService,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	app *apptypes.App,
) (createdApp *apptypes.App, err error) {
	if app == nil {
		return nil, errutil.Err(nil, "app cannot be nil")
	}

	issSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return nil, errutil.Err(err, "unable to fetch settings")
	}

	var clientCredentials *idpcore.ClientCredentials
	var idp idpcore.Idp

	if issSettings.IdpType != settingstypes.IDP_TYPE_SELF {
		// Create a new IDP instance based on the issuer settings.
		idp, err = idpcore.NewIdp(ctx, issSettings)
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
	}

	userID, ok := identitycontext.GetUserID(ctx)
	if !ok {
		return nil, errors.New("user id not found in context")
	}

	appID, err := s.identityService.GenerateID(ctx, clientCredentials, &identitycore.Issuer{
		CommonName: issSettings.IssuerID,
		KeyID:      issSettings.KeyID,
	}, userID)
	if err != nil {
		return nil, err
	}

	app.ID = appID

	createdApp, err = s.appRepository.CreateApp(ctx, app)
	if err != nil {
		return nil, err
	}

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

	return app, nil
}
