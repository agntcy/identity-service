// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/google/uuid"
	appcore "github.com/outshift/identity-service/internal/core/app"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	badgecore "github.com/outshift/identity-service/internal/core/badge"
	identitycore "github.com/outshift/identity-service/internal/core/identity"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	policytypes "github.com/outshift/identity-service/internal/core/policy/types"
	settingscore "github.com/outshift/identity-service/internal/core/settings"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/internal/pkg/iam"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/sorting"
	"github.com/outshift/identity-service/internal/pkg/strutil"
	"github.com/outshift/identity-service/pkg/log"
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
		sortBy sorting.Sorting,
	) (*pagination.Pageable[apptypes.App], error)
	CountAllApps(ctx context.Context) (int64, error)
	DeleteApp(ctx context.Context, appID string) error
	RefreshAppAPIKey(ctx context.Context, appID string) (*apptypes.App, error)
	GetTasksPerAppType(
		ctx context.Context,
		excludeAppIDs []string,
	) (map[apptypes.AppType][]*policytypes.Task, error)
}

type appService struct {
	appRepository      appcore.Repository
	settingsRepository settingscore.Repository
	identityService    identitycore.Service
	idpFactory         idpcore.IdpFactory
	credentialStore    idpcore.CredentialStore
	iamClient          iam.Client
	badgeRevoker       badgecore.Revoker
	keyStore           identitycore.KeyStore
	policyRepository   policycore.Repository
	taskService        policycore.TaskService
}

func NewAppService(
	appRepository appcore.Repository,
	settingsRepository settingscore.Repository,
	identityService identitycore.Service,
	idpFactory idpcore.IdpFactory,
	credentialStore idpcore.CredentialStore,
	iamClient iam.Client,
	badgeRevoker badgecore.Revoker,
	keyStore identitycore.KeyStore,
	policyRepository policycore.Repository,
	taskService policycore.TaskService,
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
		taskService:        taskService,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	app *apptypes.App,
) (*apptypes.App, error) {
	if app == nil {
		return nil, errutil.InvalidRequest("app.invalidApp", "Application payload is invalid.")
	}

	if app.Type == apptypes.APP_TYPE_UNSPECIFIED {
		return nil, errutil.ValidationFailed("app.invalidAppType", "Application type is invalid.")
	}

	issSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("repository failed to fetch settings: %w", err)
	}

	idp, err := s.idpFactory.Create(ctx, issSettings)
	if err != nil {
		return nil, fmt.Errorf("failed to create IdP instance: %w", err)
	}

	// For self issuers, the SelfIdp will use the UserID stored in the context
	// as the issuer to create client creds, we should make sure that we always
	// pass the one in the IssuerSettings.
	ctxWithIssuer := identitycontext.InsertUserID(ctx, issSettings.IssuerID)

	clientCredentials, err := idp.CreateClientCredentialsPair(ctxWithIssuer)
	if err != nil {
		return nil, fmt.Errorf("failed to create client credentials pair: %w", err)
	}

	defer func() {
		// Clean up client credentials if they were created.
		if err != nil && clientCredentials != nil {
			err = idp.DeleteClientCredentialsPair(ctx, clientCredentials)
			if err != nil {
				log.FromContext(ctx).
					WithError(err).
					Error("unable to delete client credentials")
			}
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
		return nil, fmt.Errorf("unable to store client credentials: %w", err)
	}

	apiKey, err := s.iamClient.CreateAppAPIKey(ctx, app.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate an api key: %w", err)
	}

	createdApp, err := s.appRepository.CreateApp(ctx, app)
	if err != nil {
		return nil, fmt.Errorf("repository failed to create the app: %w", err)
	}

	app.ApiKey = ptrutil.DerefStr(apiKey.Secret)

	return createdApp, nil
}

func (s *appService) UpdateApp(
	ctx context.Context,
	app *apptypes.App,
) (*apptypes.App, error) {
	if app == nil {
		return nil, errutil.InvalidRequest("app.invalidApp", "Application payload is invalid.")
	}

	storedApp, err := s.getApp(ctx, app.ID)
	if err != nil {
		return nil, err
	}

	storedApp.Name = app.Name
	storedApp.Description = app.Description
	storedApp.UpdatedAt = ptrutil.Ptr(time.Now().UTC())

	err = s.appRepository.UpdateApp(ctx, storedApp)
	if err != nil {
		return nil, fmt.Errorf("repository failed to update the app %s: %w", app.ID, err)
	}

	if storedApp.Type != apptypes.APP_TYPE_MCP_SERVER {
		_, err = s.taskService.UpdateOrCreateForAgent(ctx, app.ID, ptrutil.DerefStr(app.Name))
		if err != nil {
			return nil, fmt.Errorf("error trying to update tasks: %w", err)
		}
	}

	apiKey, err := s.iamClient.GetAppAPIKey(ctx, app.ID)
	if err != nil {
		log.FromContext(ctx).
			WithError(err).
			Warnf("iam client in UpdateApp failed to get API key for %s", app.ID)
	}

	storedApp.ApiKey = ptrutil.DerefStr(apiKey.Secret)

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
		return nil, errutil.ValidationFailed("app.idInvalid", "Invalid application ID")
	}

	app, err := s.getApp(ctx, id)
	if err != nil {
		return nil, err
	}

	apiKey, err := s.iamClient.GetAppAPIKey(ctx, app.ID)
	if err != nil {
		log.FromContext(ctx).
			WithError(err).
			Warnf("iam client in GetApp failed to get API key for %s", app.ID)
	}

	app.ApiKey = ptrutil.DerefStr(apiKey.Secret)

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
	sortBy sorting.Sorting,
) (*pagination.Pageable[apptypes.App], error) {
	appTypes = slices.DeleteFunc(appTypes, func(typ apptypes.AppType) bool {
		return typ == apptypes.APP_TYPE_UNSPECIFIED
	})

	page, err := s.appRepository.GetAllApps(ctx, paginationFilter, query, appTypes, sortBy)
	if err != nil {
		return nil, fmt.Errorf("repository failed to fetch all apps: %w", err)
	}

	err = s.populateStatues(ctx, page.Items...)
	if err != nil {
		return nil, err
	}

	return page, nil
}

func (s *appService) CountAllApps(ctx context.Context) (int64, error) {
	count, err := s.appRepository.CountAllApps(ctx)
	if err != nil {
		return int64(0), fmt.Errorf("repository failed to count all apps: %w", err)
	}

	return count, nil
}

func (s *appService) DeleteApp(ctx context.Context, appID string) error {
	if appID == "" {
		return errutil.ValidationFailed("app.idInvalid", "Invalid application ID")
	}

	app, err := s.getApp(ctx, appID)
	if err != nil {
		return err
	}

	issSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return fmt.Errorf("repository failed to fetch settings: %w", err)
	}

	idp, err := s.idpFactory.Create(ctx, issSettings)
	if err != nil {
		return fmt.Errorf("failed to create IdP instance: %w", err)
	}

	clientCredentials, err := s.credentialStore.Get(ctx, app.ID)
	if err == nil {
		err := s.revokeAppBadges(ctx, app.ID, issSettings, clientCredentials)
		if err != nil {
			return err
		}

		err = idp.DeleteClientCredentialsPair(ctx, clientCredentials)
		if err != nil {
			return fmt.Errorf("idp client failed to delete client credentials for app %s: %w", app.ID, err)
		}
	} else if !errors.Is(err, idpcore.ErrCredentialNotFound) {
		return fmt.Errorf("unable to fetch client credentials for app %s: %w", app.ID, err)
	}

	err = s.credentialStore.Delete(ctx, app.ID)
	if err != nil {
		return fmt.Errorf("credential store failed to delete credentials for app %s: %w", app.ID, err)
	}

	err = s.policyRepository.DeletePoliciesByAppID(ctx, app.ID)
	if err != nil {
		return fmt.Errorf("repository failed to delete policies for app %s: %w", app.ID, err)
	}

	err = s.policyRepository.DeleteTasksByAppID(ctx, app.ID)
	if err != nil {
		return fmt.Errorf("repository failed to delete tasks for app %s: %w", app.ID, err)
	}

	err = s.appRepository.DeleteApp(ctx, app)
	if err != nil {
		return fmt.Errorf("repository failed to delete app %s: %w", app.ID, err)
	}

	return nil
}

func (s *appService) revokeAppBadges(
	ctx context.Context,
	appID string,
	issSettings *settingstypes.IssuerSettings,
	clientCredentials *idpcore.ClientCredentials,
) error {
	privKey, err := s.keyStore.RetrievePrivKey(ctx, issSettings.KeyID)
	if err != nil {
		return fmt.Errorf("unable to retrieve private key with ID %s: %w", issSettings.KeyID, err)
	}

	issuer := identitycore.Issuer{
		CommonName: issSettings.IssuerID,
		KeyID:      issSettings.KeyID,
	}

	err = s.badgeRevoker.RevokeAll(ctx, appID, clientCredentials, &issuer, privKey)
	if err != nil {
		return fmt.Errorf("unable to revoke badges for app %s: %w", appID, err)
	}

	return nil
}

func (s *appService) RefreshAppAPIKey(
	ctx context.Context,
	appID string,
) (*apptypes.App, error) {
	if appID == "" {
		return nil, errutil.ValidationFailed("app.idInvalid", "Invalid application ID.")
	}

	app, err := s.getApp(ctx, appID)
	if err != nil {
		return nil, err
	}

	apiKey, err := s.iamClient.RefreshAppAPIKey(ctx, app.ID)
	if err != nil {
		return nil, fmt.Errorf("iam client failed to refresh API key for app %s: %w", app.ID, err)
	}

	app.ApiKey = ptrutil.DerefStr(apiKey.Secret)

	err = s.appRepository.UpdateApp(ctx, app)
	if err != nil {
		return nil, fmt.Errorf("repository failed to update app %s with new API key: %w", app.ID, err)
	}

	return app, nil
}

func (s *appService) GetTasksPerAppType(
	ctx context.Context,
	excludeAppIDs []string,
) (map[apptypes.AppType][]*policytypes.Task, error) {
	tasks, err := s.policyRepository.GetTasksPerAppType(ctx, strutil.TrimSlice(excludeAppIDs)...)
	if err != nil {
		return nil, fmt.Errorf("repository failed to fetch tasks per app type: %w", err)
	}

	return tasks, nil
}

func (s *appService) getApp(ctx context.Context, id string) (*apptypes.App, error) {
	app, err := s.appRepository.GetApp(ctx, id)
	if err != nil {
		if errors.Is(err, appcore.ErrAppNotFound) {
			return nil, errutil.NotFound("app.notFound", "Application not found")
		}

		return nil, fmt.Errorf("there was an error fetching the app %s: %w", id, err)
	}

	return app, nil
}

func (s *appService) populateStatues(ctx context.Context, apps ...*apptypes.App) error {
	appIDs := make([]string, len(apps))
	for idx, app := range apps {
		appIDs[idx] = app.ID
	}

	statuses, err := s.appRepository.GetAppStatuses(ctx, appIDs...)
	if err != nil {
		return fmt.Errorf("repository failed to fetch statuses for apps %s: %w", appIDs, err)
	}

	for _, app := range apps {
		if status, ok := statuses[app.ID]; ok {
			app.Status = status
		}
	}

	return nil
}
