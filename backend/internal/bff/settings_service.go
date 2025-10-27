// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package bff

import (
	"context"
	"fmt"

	iamtypes "github.com/agntcy/identity-service/internal/core/iam/types"
	idpcore "github.com/agntcy/identity-service/internal/core/idp"
	settingscore "github.com/agntcy/identity-service/internal/core/settings"
	settingstypes "github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/internal/pkg/iam"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/pkg/log"
)

type SettingsService interface {
	GetSettings(ctx context.Context) (*settingstypes.Settings, error)
	SetApiKey(ctx context.Context) (*settingstypes.ApiKey, error)
	SetIssuerSettings(
		ctx context.Context,
		issuerSettings *settingstypes.IssuerSettings,
	) (*settingstypes.IssuerSettings, error)
}

type settingsService struct {
	issuerSrv          settingscore.IssuerService
	iamClient          iam.Client
	settingsRepository settingscore.Repository
	idpFactory         idpcore.IdpFactory
}

func NewSettingsService(
	issuerSrv settingscore.IssuerService,
	iamClient iam.Client,
	settingsRepository settingscore.Repository,
	idpFactory idpcore.IdpFactory,
) SettingsService {
	return &settingsService{
		issuerSrv:          issuerSrv,
		iamClient:          iamClient,
		settingsRepository: settingsRepository,
		idpFactory:         idpFactory,
	}
}

func (s *settingsService) GetSettings(
	ctx context.Context,
) (*settingstypes.Settings, error) {
	issuerSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("repository in GetSettings failed to fetch issuer settings: %w", err)
	}

	// Get the API key from the IAM client.
	apiKey, err := s.iamClient.GetTenantAPIKey(ctx)
	if err != nil {
		log.FromContext(ctx).
			WithError(err).
			Warn("iam client in GetSettings failed to get tenant API key")
	}

	if apiKey == nil {
		apiKey = &iamtypes.APIKey{}
	}

	return &settingstypes.Settings{
		IssuerSettings: issuerSettings,
		ApiKey: &settingstypes.ApiKey{
			ApiKey: ptrutil.DerefStr(apiKey.Secret),
		},
	}, nil
}

func (s *settingsService) SetApiKey(
	ctx context.Context,
) (*settingstypes.ApiKey, error) {
	// Get existing key and revoke it if necessary.
	_, err := s.iamClient.GetTenantAPIKey(ctx)
	if err == nil {
		if err := s.iamClient.RevokeTenantAPIKey(ctx); err != nil {
			return nil, fmt.Errorf("failed to revoke existing Api key: %w", err)
		}
	} else {
		log.FromContext(ctx).
			WithError(err).
			Warn("iam client in SetApiKey failed to get tenant API key")
	}

	// Generate a new Api key.
	newApiKey, err := s.iamClient.CreateTenantAPIKey(ctx)
	if err != nil {
		return nil, fmt.Errorf("iam client in SetApiKey failed to create new Api key: %w", err)
	}

	// Return the new Api key.
	return &settingstypes.ApiKey{
		ApiKey: ptrutil.DerefStr(newApiKey.Secret),
	}, nil
}

func (s *settingsService) SetIssuerSettings(
	ctx context.Context,
	issuerSettings *settingstypes.IssuerSettings,
) (*settingstypes.IssuerSettings, error) {
	if issuerSettings == nil {
		return nil, errutil.ValidationFailed("settings.invalidPayload", "Invalid issuer settings payload.")
	}

	existingSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err == nil && existingSettings.IssuerID != "" {
		return s.updateIssuerSettings(ctx, existingSettings, issuerSettings)
	}

	// Set the issuer id based on the issuer settings.
	err = s.issuerSrv.SetIssuer(ctx, issuerSettings)
	if err != nil {
		return nil, fmt.Errorf("issuer service in SetIssuer failed to set issuer settings: %w", err)
	}

	// Update the issuer settings in the repository.
	updatedSettings, err := s.settingsRepository.UpdateIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, fmt.Errorf("repository in SetIssuer failed to update issuer settings: %w", err)
	}

	return updatedSettings, nil
}

func (s *settingsService) updateIssuerSettings(
	ctx context.Context,
	issuerSettings *settingstypes.IssuerSettings,
	updatePayload *settingstypes.IssuerSettings,
) (*settingstypes.IssuerSettings, error) {
	if issuerSettings.IdpType != updatePayload.IdpType {
		return nil, errutil.InvalidRequest("settings.invalidIdpType", "Invalid IdP type in the update payload.")
	}

	switch issuerSettings.IdpType {
	case settingstypes.IDP_TYPE_DUO:
		if updatePayload.DuoIdpSettings == nil || updatePayload.DuoIdpSettings.SecretKey == "" {
			return nil, errutil.ValidationFailed(
				"settings.invalidDuoUpdatePayload",
				"Invalid Duo settings payload. Make sure the secret key is not empty.",
			)
		}

		issuerSettings.DuoIdpSettings.SecretKey = updatePayload.DuoIdpSettings.SecretKey
	case settingstypes.IDP_TYPE_OKTA:
		if updatePayload.OktaIdpSettings == nil || updatePayload.OktaIdpSettings.PrivateKey == "" {
			return nil, errutil.ValidationFailed(
				"settings.invalidOktaUpdatePayload",
				"Invalid Okta settings payload. Make sure the private key is not empty.",
			)
		}

		issuerSettings.OktaIdpSettings.PrivateKey = updatePayload.OktaIdpSettings.PrivateKey
	case settingstypes.IDP_TYPE_ORY:
		if updatePayload.OryIdpSettings == nil || updatePayload.OryIdpSettings.ApiKey == "" {
			return nil, errutil.ValidationFailed(
				"settings.invalidOryUpdatePayload",
				"Invalid Ory settings payload. Make sure the API key is not empty.",
			)
		}

		issuerSettings.OryIdpSettings.ApiKey = updatePayload.OryIdpSettings.ApiKey
	case settingstypes.IDP_TYPE_KEYCLOAK:
		if updatePayload.KeycloakIdpSettings == nil || updatePayload.KeycloakIdpSettings.ClientSecret == "" {
			return nil, errutil.ValidationFailed(
				"settings.invalidKeycloakUpdatePayload",
				"Invalid Keycloak settings payload. Make sure the client secret is not empty.",
			)
		}

		issuerSettings.KeycloakIdpSettings.ClientSecret = updatePayload.KeycloakIdpSettings.ClientSecret
	default:
		return nil, errutil.InvalidRequest(
			"settings.updateNotSupported",
			"Updating existing issuer settings is not supported for IdP type %s.",
			issuerSettings.IdpType,
		)
	}

	// Validate the new settings by trying to connect to the IdP
	_, err := s.idpFactory.Create(ctx, updatePayload)
	if err != nil {
		return nil, fmt.Errorf("idp factory in updateIssuerSettings failed to create an IdP instance: %w", err)
	}

	updatedSettings, err := s.settingsRepository.UpdateIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, fmt.Errorf("repository in updateIssuerSettings failed to update issuer settings: %w", err)
	}

	return updatedSettings, nil
}
