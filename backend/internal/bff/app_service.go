// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package bff

import (
	"context"
	"fmt"
	"time"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	badgecore "github.com/agntcy/identity-platform/internal/core/badge"
	identitycore "github.com/agntcy/identity-platform/internal/core/identity"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	policycore "github.com/agntcy/identity-platform/internal/core/policy"
	policytypes "github.com/agntcy/identity-platform/internal/core/policy/types"
	settingscore "github.com/agntcy/identity-platform/internal/core/settings"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	outshiftiam "github.com/agntcy/identity-platform/internal/pkg/iam"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/pkg/log"
	"github.com/google/uuid"
)

type AppService interface {
	CreateApp(ctx context.Context, app *apptypes.App) (*apptypes.App, error)
	UpdateApp(ctx context.Context, app *apptypes.App) (*apptypes.App, error)
	GetApp(ctx context.Context, id string) (*apptypes.App, error)
	ListApps(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
		appTypes []apptypes.AppType,
	) (*pagination.Pageable[apptypes.App], error)
	DeleteApp(ctx context.Context, appID string) error
	GetTasks(
		ctx context.Context,
		appID string,
	) ([]*policytypes.Task, error)
}

type appService struct {
	appRepository      appcore.Repository
	settingsRepository settingscore.Repository
	identityService    identitycore.Service
	idpFactory         idpcore.IdpFactory
	credentialStore    idpcore.CredentialStore
	iamClient          outshiftiam.Client
	badgeRevoker       badgecore.Revoker
	keyStore           identitycore.KeyStore
	policyRepository   policycore.Repository
}

func NewAppService(
	appRepository appcore.Repository,
	settingsRepository settingscore.Repository,
	identityService identitycore.Service,
	idpFactory idpcore.IdpFactory,
	credentialStore idpcore.CredentialStore,
	iamClient outshiftiam.Client,
	badgeRevoker badgecore.Revoker,
	keyStore identitycore.KeyStore,
	policyRepository policycore.Repository,
) AppService {
	return &appService{
		appRepository:      appRepository,
		settingsRepository: settingsRepository,
		identityService:    identityService,
		idpFactory:         idpFactory,
		credentialStore:    credentialStore,
		iamClient:          iamClient,
		badgeRevoker:       badgeRevoker,
		keyStore:           keyStore,
		policyRepository:   policyRepository,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	app *apptypes.App,
) (*apptypes.App, error) {
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

	idp, err := s.idpFactory.Create(ctx, issSettings)
	if err != nil {
		return nil, errutil.Err(err, "failed to create IDP instance")
	}

	clientCredentials, err := idp.CreateClientCredentialsPair(ctx)
	if err != nil {
		return nil, errutil.Err(err, "failed to create client credentials pair")
	}

	defer func() {
		// Clean up client credentials if they were created.
		if err != nil && clientCredentials != nil {
			_ = idp.DeleteClientCredentialsPair(ctx, clientCredentials)
		}
	}()

	resolverMetadataID, err := s.identityService.GenerateID(
		ctx,
		clientCredentials,
		&identitycore.Issuer{
			CommonName: issSettings.IssuerID,
			KeyID:      issSettings.KeyID,
		},
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

	createdApp, err := s.appRepository.CreateApp(ctx, app)
	if err != nil {
		return nil, err
	}

	app.ApiKey = apiKey.Secret

	return createdApp, nil
}

func (s *appService) UpdateApp(
	ctx context.Context,
	app *apptypes.App,
) (*apptypes.App, error) {
	if app == nil {
		return nil, errutil.Err(nil, "app cannot be nil")
	}

	storedApp, err := s.appRepository.GetApp(ctx, app.ID)
	if err != nil {
		return nil, errutil.Err(err, err.Error())
	}

	storedApp.Name = app.Name
	storedApp.Description = app.Description
	storedApp.UpdatedAt = ptrutil.Ptr(time.Now().UTC())

	err = s.appRepository.UpdateApp(ctx, storedApp)
	if err != nil {
		return nil, err
	}

	apiKey, err := s.iamClient.GetAppApiKey(ctx, app.ID)
	if err != nil {
		log.Warn(err)
	}

	storedApp.ApiKey = apiKey.Secret

	err = s.populateStatues(ctx, storedApp)
	if err != nil {
		return nil, err
	}

	return storedApp, nil
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

	err = s.populateStatues(ctx, app)
	if err != nil {
		return nil, err
	}

	return app, nil
}

func (s *appService) ListApps(
	ctx context.Context,
	paginationFilter pagination.PaginationFilter,
	query *string,
	appTypes []apptypes.AppType,
) (*pagination.Pageable[apptypes.App], error) {
	page, err := s.appRepository.GetAllApps(ctx, paginationFilter, query, appTypes)
	if err != nil {
		return nil, err
	}

	err = s.populateStatues(ctx, page.Items...)
	if err != nil {
		return nil, err
	}

	return page, nil
}

func (s *appService) DeleteApp(ctx context.Context, appID string) error {
	app, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		return errutil.Err(err, err.Error())
	}

	issSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return errutil.Err(err, "unable to fetch settings")
	}

	idp, err := s.idpFactory.Create(ctx, issSettings)
	if err != nil {
		return errutil.Err(err, "failed to create IDP instance")
	}

	clientCredentials, err := s.credentialStore.Get(ctx, app.ID)
	if err != nil {
		return fmt.Errorf("unable to fetch client credentials: %w", err)
	}

	privKey, err := s.keyStore.RetrievePrivKey(ctx, issSettings.KeyID)
	if err != nil {
		return fmt.Errorf("unable to retrieve private key: %w", err)
	}

	issuer := identitycore.Issuer{
		CommonName: issSettings.IssuerID,
		KeyID:      issSettings.KeyID,
	}

	err = s.badgeRevoker.RevokeAll(ctx, app.ID, clientCredentials, &issuer, privKey)
	if err != nil {
		return err
	}

	if clientCredentials != nil {
		err := idp.DeleteClientCredentialsPair(ctx, clientCredentials)
		if err != nil {
			return fmt.Errorf("unable to delete client credentials: %w", err)
		}
	}

	err = s.credentialStore.Delete(ctx, app.ID)
	if err != nil {
		return err
	}

	err = s.appRepository.DeleteApp(ctx, app)
	if err != nil {
		return fmt.Errorf("unable to delete the app: %w", err)
	}

	return nil
}

func (s *appService) GetTasks(
	ctx context.Context,
	appID string,
) ([]*policytypes.Task, error) {
	app, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		return nil, err
	}

	tasks, err := s.policyRepository.GetTasksByAppID(ctx, app.ID)
	if err != nil {
		return nil, err
	}

	return tasks, nil
}

func (s *appService) populateStatues(ctx context.Context, apps ...*apptypes.App) error {
	appIDs := make([]string, len(apps))
	for idx, app := range apps {
		appIDs[idx] = app.ID
	}

	statuses, err := s.appRepository.GetAppStatuses(ctx, appIDs...)
	if err != nil {
		return fmt.Errorf("unable to fetch statuses for apps: %w", err)
	}

	for _, app := range apps {
		if status, ok := statuses[app.ID]; ok {
			app.Status = status
		}
	}

	return nil
}
