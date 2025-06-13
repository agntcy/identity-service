// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package bff

import (
	"context"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

type AppService interface {
	CreateApp(ctx context.Context, app *apptypes.App) (*apptypes.App, error)
	GetApp(ctx context.Context, id string) (*apptypes.App, error)
}

type appService struct {
	appRepository appcore.Repository
}

func NewAppService(
	appRepository appcore.Repository,
) AppService {
	return &appService{
		appRepository: appRepository,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	app *apptypes.App,
) (*apptypes.App, error) {
	if app == nil {
		return nil, errutil.Err(nil, "app cannot be nil")
	}

	createdApp, err := s.appRepository.CreateApp(ctx, app)
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
