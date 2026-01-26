// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/agntcy/identity-service/internal/bff"
	iamtypes "github.com/agntcy/identity-service/internal/core/iam/types"
	idpmocks "github.com/agntcy/identity-service/internal/core/idp/mocks"
	settingsmocks "github.com/agntcy/identity-service/internal/core/settings/mocks"
	settingstypes "github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	iammocks "github.com/agntcy/identity-service/internal/pkg/iam/mocks"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSettingsService_GetSettings(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	t.Run("should fetch issuer settings and the tenant api key", func(t *testing.T) {
		t.Parallel()

		issuerSettings := &settingstypes.IssuerSettings{}
		apiKey := &settingstypes.ApiKey{
			ApiKey: uuid.NewString(),
		}

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuerSettings, nil)

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(&iamtypes.APIKey{Secret: &apiKey.ApiKey}, nil)

		sut := bff.NewSettingsService(nil, iamClient, settingsRepo, nil)

		ret, err := sut.GetSettings(ctx)

		assert.NoError(t, err)
		assert.Equal(t, issuerSettings, ret.IssuerSettings)
		assert.Equal(t, apiKey, ret.ApiKey)
	})

	t.Run("should return an error when settings repo fails", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("failed"))

		sut := bff.NewSettingsService(nil, nil, settingsRepo, nil)

		_, err := sut.GetSettings(ctx)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed")
	})

	t.Run("should return an empty API Key when iam client doesn't return a key", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(&settingstypes.IssuerSettings{}, nil)

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(nil, nil)

		sut := bff.NewSettingsService(nil, iamClient, settingsRepo, nil)

		ret, err := sut.GetSettings(ctx)

		assert.NoError(t, err)
		assert.Empty(t, ret.ApiKey.ApiKey)
	})
}

func TestSettingsService_SetApiKey(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	t.Run("should set a API key for a tenant when it doesn't have one yet", func(t *testing.T) {
		t.Parallel()

		apiKey := uuid.NewString()

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(nil, errors.New("not found"))
		iamClient.EXPECT().CreateTenantAPIKey(ctx).Return(&iamtypes.APIKey{Secret: &apiKey}, nil)

		sut := bff.NewSettingsService(nil, iamClient, nil, nil)

		ret, err := sut.SetApiKey(ctx)

		assert.NoError(t, err)
		assert.Equal(t, apiKey, ret.ApiKey)
	})

	t.Run("should revoke an existing API key for the tenant before creating a new one", func(t *testing.T) {
		t.Parallel()

		apiKey := uuid.NewString()

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(nil, nil)
		iamClient.EXPECT().RevokeTenantAPIKey(ctx).Return(nil)
		iamClient.EXPECT().CreateTenantAPIKey(ctx).Return(&iamtypes.APIKey{Secret: &apiKey}, nil)

		sut := bff.NewSettingsService(nil, iamClient, nil, nil)

		ret, err := sut.SetApiKey(ctx)

		assert.NoError(t, err)
		assert.Equal(t, apiKey, ret.ApiKey)
	})

	t.Run("should return an error if the revocation fails", func(t *testing.T) {
		t.Parallel()

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(nil, nil)
		iamClient.EXPECT().RevokeTenantAPIKey(ctx).Return(errors.New("failed"))

		sut := bff.NewSettingsService(nil, iamClient, nil, nil)

		_, err := sut.SetApiKey(ctx)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed to revoke existing Api key")
	})

	t.Run("should return an error if the IAM fails to create an API key", func(t *testing.T) {
		t.Parallel()

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(nil, errors.New("not found"))
		iamClient.EXPECT().CreateTenantAPIKey(ctx).Return(nil, errors.New("failed"))

		sut := bff.NewSettingsService(nil, iamClient, nil, nil)

		_, err := sut.SetApiKey(ctx)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed to create new Api key")
	})
}

func TestSettingsService_SetIssuerSettings(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	issuerSettings := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
	}

	t.Run("should set settings for an issuer when not found", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("not found"))
		settingsRepo.EXPECT().UpdateIssuerSettings(ctx, issuerSettings).Return(issuerSettings, nil)

		issuerSrv := settingsmocks.NewIssuerService(t)
		issuerSrv.EXPECT().SetIssuer(ctx, issuerSettings).Return(nil)

		sut := bff.NewSettingsService(issuerSrv, nil, settingsRepo, nil)

		ret, err := sut.SetIssuerSettings(ctx, issuerSettings)

		assert.NoError(t, err)
		assert.Equal(t, issuerSettings, ret)
	})

	t.Run("should not update an existing settings for a self-issued issuer", func(t *testing.T) {
		t.Parallel()

		existingSelfIssuerSettings := &settingstypes.IssuerSettings{
			IssuerID: uuid.NewString(),
			IdpType:  settingstypes.IDP_TYPE_SELF,
		}
		updatePayload := &settingstypes.IssuerSettings{
			IdpType: settingstypes.IDP_TYPE_SELF,
		}

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(existingSelfIssuerSettings, nil)

		sut := bff.NewSettingsService(nil, nil, settingsRepo, nil)

		_, err := sut.SetIssuerSettings(ctx, updatePayload)

		assert.Error(t, err)
		assert.ErrorIs(
			t,
			err,
			errutil.InvalidRequest(
				"settings.updateNotSupported",
				"Updating existing issuer settings is not supported for IdP type %s.",
				existingSelfIssuerSettings.IdpType,
			),
		)
	})

	t.Run("should not update an existing settings when idp connection fails", func(t *testing.T) {
		t.Parallel()

		settings := settingstypes.IssuerSettings{
			IssuerID: uuid.NewString(),
			IdpType:  settingstypes.IDP_TYPE_DUO,
			DuoIdpSettings: &settingstypes.DuoIdpSettings{
				SecretKey: uuid.NewString(),
			},
		}

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(t.Context()).Return(&settings, nil)

		idpFactory := idpmocks.NewIdpFactory(t)
		idpFactory.EXPECT().Create(t.Context(), mock.Anything).Return(nil, errors.New("failed"))

		sut := bff.NewSettingsService(nil, nil, settingsRepo, idpFactory)

		_, err := sut.SetIssuerSettings(t.Context(), &settings)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed to create an IdP instance")
	})

	t.Run("should return an error when IssuerService fails", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("not found"))

		issuerSrv := settingsmocks.NewIssuerService(t)
		issuerSrv.EXPECT().SetIssuer(ctx, issuerSettings).Return(errors.New("failed"))

		sut := bff.NewSettingsService(issuerSrv, nil, settingsRepo, nil)

		_, err := sut.SetIssuerSettings(ctx, issuerSettings)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed to set issuer settings")
	})

	t.Run("should return an error when repository fails to store settings", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("not found"))
		settingsRepo.EXPECT().UpdateIssuerSettings(ctx, issuerSettings).Return(nil, errors.New("failed"))

		issuerSrv := settingsmocks.NewIssuerService(t)
		issuerSrv.EXPECT().SetIssuer(ctx, issuerSettings).Return(nil)

		sut := bff.NewSettingsService(issuerSrv, nil, settingsRepo, nil)

		_, err := sut.SetIssuerSettings(ctx, issuerSettings)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed")
	})

	t.Run("should return an error when input is nil", func(t *testing.T) {
		t.Parallel()

		sut := bff.NewSettingsService(nil, nil, nil, nil)

		_, err := sut.SetIssuerSettings(ctx, nil)

		assert.ErrorIs(t, err, errutil.ValidationFailed("settings.invalidPayload", "Invalid issuer settings payload."))
	})
}

func TestSettingsService_SetIssuerSettings_should_update(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		updatePayload *settingstypes.IssuerSettings
		patchExpected func(src, dst *settingstypes.IssuerSettings)
	}{
		"should update Duo settings": {
			updatePayload: &settingstypes.IssuerSettings{
				IdpType: settingstypes.IDP_TYPE_DUO,
				DuoIdpSettings: &settingstypes.DuoIdpSettings{
					SecretKey: uuid.NewString(),
				},
			},
			patchExpected: func(src, dst *settingstypes.IssuerSettings) {
				dst.DuoIdpSettings.SecretKey = src.DuoIdpSettings.SecretKey
			},
		},
		"should update Okta settings": {
			updatePayload: &settingstypes.IssuerSettings{
				IdpType: settingstypes.IDP_TYPE_OKTA,
				OktaIdpSettings: &settingstypes.OktaIdpSettings{
					PrivateKey: uuid.NewString(),
				},
			},
			patchExpected: func(src, dst *settingstypes.IssuerSettings) {
				dst.OktaIdpSettings.PrivateKey = src.OktaIdpSettings.PrivateKey
			},
		},
		"should update Ory settings": {
			updatePayload: &settingstypes.IssuerSettings{
				IdpType: settingstypes.IDP_TYPE_ORY,
				OryIdpSettings: &settingstypes.OryIdpSettings{
					ApiKey: uuid.NewString(),
				},
			},
			patchExpected: func(src, dst *settingstypes.IssuerSettings) {
				dst.OryIdpSettings.ApiKey = src.OryIdpSettings.ApiKey
			},
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			settings := settingstypes.IssuerSettings{}
			_ = gofakeit.Struct(&settings)
			settings.IdpType = tc.updatePayload.IdpType

			expectedSettings, err := naiveDeepCopy(&settings)
			assert.NoError(t, err)

			tc.patchExpected(tc.updatePayload, expectedSettings)

			settingsRepo := settingsmocks.NewRepository(t)
			settingsRepo.EXPECT().GetIssuerSettings(t.Context()).Return(&settings, nil)
			settingsRepo.EXPECT().UpdateIssuerSettings(t.Context(), mock.Anything).Return(&settings, nil)

			idpFactory := idpmocks.NewIdpFactory(t)
			idpFactory.EXPECT().Create(t.Context(), tc.updatePayload).Return(nil, nil)

			sut := bff.NewSettingsService(nil, nil, settingsRepo, idpFactory)

			actualSettings, err := sut.SetIssuerSettings(t.Context(), tc.updatePayload)

			assert.NoError(t, err)
			assert.EqualExportedValues(t, expectedSettings, actualSettings)
		})
	}
}

func TestSettingsService_SetIssuerSettings_should_not_update_with_idp_type_mismatch(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		input  settingstypes.IdpType
		stored settingstypes.IdpType
	}{
		"duo settings with the wrong idp type": {
			input:  settingstypes.IDP_TYPE_OKTA,
			stored: settingstypes.IDP_TYPE_DUO,
		},
		"okta settings with the wrong idp type": {
			input:  settingstypes.IDP_TYPE_DUO,
			stored: settingstypes.IDP_TYPE_OKTA,
		},
		"ory settings with the wrong idp type": {
			input:  settingstypes.IDP_TYPE_DUO,
			stored: settingstypes.IDP_TYPE_ORY,
		},
		"keycloak settings with the wrong idp type": {
			input:  settingstypes.IDP_TYPE_DUO,
			stored: settingstypes.IDP_TYPE_KEYCLOAK,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			settings := settingstypes.IssuerSettings{
				IssuerID: uuid.NewString(),
				IdpType:  tc.stored,
			}

			settingsRepo := settingsmocks.NewRepository(t)
			settingsRepo.EXPECT().GetIssuerSettings(t.Context()).Return(&settings, nil)

			sut := bff.NewSettingsService(nil, nil, settingsRepo, nil)

			_, err := sut.SetIssuerSettings(t.Context(), &settingstypes.IssuerSettings{
				IdpType: tc.input,
			})

			assert.Error(t, err)
			assert.ErrorIs(t, err, errutil.InvalidRequest("settings.invalidIdpType", "Invalid IdP type in the update payload."))
		})
	}
}

func TestSettingsService_SetIssuerSettings_should_not_update_when_payload_is_empty(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		input *settingstypes.IssuerSettings
		err   error
	}{
		"nil Duo settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:        settingstypes.IDP_TYPE_DUO,
				DuoIdpSettings: nil,
			},
			err: errutil.ValidationFailed(
				"settings.invalidDuoUpdatePayload",
				"Invalid Duo settings payload. Make sure the secret key is not empty.",
			),
		},
		"empty secret key in Duo settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:        settingstypes.IDP_TYPE_DUO,
				DuoIdpSettings: &settingstypes.DuoIdpSettings{SecretKey: ""},
			},
			err: errutil.ValidationFailed(
				"settings.invalidDuoUpdatePayload",
				"Invalid Duo settings payload. Make sure the secret key is not empty.",
			),
		},
		"nil Okta settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:         settingstypes.IDP_TYPE_OKTA,
				OktaIdpSettings: nil,
			},
			err: errutil.ValidationFailed(
				"settings.invalidOktaUpdatePayload",
				"Invalid Okta settings payload. Make sure the private key is not empty.",
			),
		},
		"empty private key in Okta settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:         settingstypes.IDP_TYPE_OKTA,
				OktaIdpSettings: &settingstypes.OktaIdpSettings{PrivateKey: ""},
			},
			err: errutil.ValidationFailed(
				"settings.invalidOktaUpdatePayload",
				"Invalid Okta settings payload. Make sure the private key is not empty.",
			),
		},
		"nil Ory settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:        settingstypes.IDP_TYPE_ORY,
				OryIdpSettings: nil,
			},
			err: errutil.ValidationFailed(
				"settings.invalidOryUpdatePayload",
				"Invalid Ory settings payload. Make sure the API key is not empty.",
			),
		},
		"empty api key in Ory settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:        settingstypes.IDP_TYPE_ORY,
				OryIdpSettings: &settingstypes.OryIdpSettings{ApiKey: ""},
			},
			err: errutil.ValidationFailed(
				"settings.invalidOryUpdatePayload",
				"Invalid Ory settings payload. Make sure the API key is not empty.",
			),
		},
		"nil Keycloak settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:             settingstypes.IDP_TYPE_KEYCLOAK,
				KeycloakIdpSettings: nil,
			},
			err: errutil.ValidationFailed(
				"settings.invalidKeycloakUpdatePayload",
				"Invalid Keycloak settings payload. Make sure the client secret is not empty.",
			),
		},
		"empty client secret in Keycloak settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:             settingstypes.IDP_TYPE_KEYCLOAK,
				KeycloakIdpSettings: &settingstypes.KeycloakIdpSettings{ClientSecret: ""},
			},
			err: errutil.ValidationFailed(
				"settings.invalidKeycloakUpdatePayload",
				"Invalid Keycloak settings payload. Make sure the client secret is not empty.",
			),
		},
		"nil Ping settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:         settingstypes.IDP_TYPE_PING,
				PingIdpSettings: nil,
			},
			err: errutil.ValidationFailed(
				"settings.invalidPingUpdatePayload",
				"Invalid Ping settings payload.",
			),
		},
		"empty client secret in Ping settings payload": {
			input: &settingstypes.IssuerSettings{
				IdpType:         settingstypes.IDP_TYPE_PING,
				PingIdpSettings: &settingstypes.PingIdpSettings{ClientSecret: ""},
			},
			err: errutil.ValidationFailed(
				"settings.invalidPingUpdatePayload",
				"Invalid Ping settings payload.",
			),
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			settings := settingstypes.IssuerSettings{
				IssuerID: uuid.NewString(),
				IdpType:  tc.input.IdpType,
			}

			settingsRepo := settingsmocks.NewRepository(t)
			settingsRepo.EXPECT().GetIssuerSettings(t.Context()).Return(&settings, nil)

			sut := bff.NewSettingsService(nil, nil, settingsRepo, nil)

			_, err := sut.SetIssuerSettings(t.Context(), tc.input)

			assert.Error(t, err)
			assert.ErrorIs(t, err, tc.err)
		})
	}
}

func naiveDeepCopy[T any](p *T) (*T, error) {
	data, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}

	var obj T

	err = json.Unmarshal(data, &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}
