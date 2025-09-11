// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/bff"
	iamtypes "github.com/outshift/identity-service/internal/core/iam/types"
	issuermocks "github.com/outshift/identity-service/internal/core/issuer/mocks"
	settingsmocks "github.com/outshift/identity-service/internal/core/settings/mocks"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	iammocks "github.com/outshift/identity-service/internal/pkg/iam/mocks"
	"github.com/stretchr/testify/assert"
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

		sut := bff.NewSettingsService(nil, iamClient, settingsRepo)

		ret, err := sut.GetSettings(ctx)

		assert.NoError(t, err)
		assert.Equal(t, issuerSettings, ret.IssuerSettings)
		assert.Equal(t, apiKey, ret.ApiKey)
	})

	t.Run("should return an error when settings repo fails", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("failed"))

		sut := bff.NewSettingsService(nil, nil, settingsRepo)

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

		sut := bff.NewSettingsService(nil, iamClient, settingsRepo)

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

		sut := bff.NewSettingsService(nil, iamClient, nil)

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

		sut := bff.NewSettingsService(nil, iamClient, nil)

		ret, err := sut.SetApiKey(ctx)

		assert.NoError(t, err)
		assert.Equal(t, apiKey, ret.ApiKey)
	})

	t.Run("should return an error if the revocation fails", func(t *testing.T) {
		t.Parallel()

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(nil, nil)
		iamClient.EXPECT().RevokeTenantAPIKey(ctx).Return(errors.New("failed"))

		sut := bff.NewSettingsService(nil, iamClient, nil)

		_, err := sut.SetApiKey(ctx)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed to revoke existing Api key")
	})

	t.Run("should return an error if the IAM fails to create an API key", func(t *testing.T) {
		t.Parallel()

		iamClient := iammocks.NewClient(t)
		iamClient.EXPECT().GetTenantAPIKey(ctx).Return(nil, errors.New("not found"))
		iamClient.EXPECT().CreateTenantAPIKey(ctx).Return(nil, errors.New("failed"))

		sut := bff.NewSettingsService(nil, iamClient, nil)

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

		issuerSrv := issuermocks.NewService(t)
		issuerSrv.EXPECT().SetIssuer(ctx, issuerSettings).Return(nil)

		sut := bff.NewSettingsService(issuerSrv, nil, settingsRepo)

		ret, err := sut.SetIssuerSettings(ctx, issuerSettings)

		assert.NoError(t, err)
		assert.Equal(t, issuerSettings, ret)
	})

	t.Run("should not update an existing issuer settings", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuerSettings, nil)

		sut := bff.NewSettingsService(nil, nil, settingsRepo)

		_, err := sut.SetIssuerSettings(ctx, issuerSettings)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "updating existing issuer settings is not supported")
	})

	t.Run("should return an error when IssuerService fails", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("not found"))

		issuerSrv := issuermocks.NewService(t)
		issuerSrv.EXPECT().SetIssuer(ctx, issuerSettings).Return(errors.New("failed"))

		sut := bff.NewSettingsService(issuerSrv, nil, settingsRepo)

		_, err := sut.SetIssuerSettings(ctx, issuerSettings)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed to set issuer settings")
	})

	t.Run("should return an error when repository fails to store settings", func(t *testing.T) {
		t.Parallel()

		settingsRepo := settingsmocks.NewRepository(t)
		settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("not found"))
		settingsRepo.EXPECT().UpdateIssuerSettings(ctx, issuerSettings).Return(nil, errors.New("failed"))

		issuerSrv := issuermocks.NewService(t)
		issuerSrv.EXPECT().SetIssuer(ctx, issuerSettings).Return(nil)

		sut := bff.NewSettingsService(issuerSrv, nil, settingsRepo)

		_, err := sut.SetIssuerSettings(ctx, issuerSettings)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed")
	})
}
