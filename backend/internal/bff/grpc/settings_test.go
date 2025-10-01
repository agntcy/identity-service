// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"context"
	"errors"
	"testing"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff/grpc"
	bffmocks "github.com/agntcy/identity-service/internal/bff/mocks"
	settingstypes "github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

var errSettingsUnexpected = errors.New("failed")

func TestSettingsService_GetSettings(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	t.Run("should get settings", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().
			GetSettings(ctx).
			Return(
				&settingstypes.Settings{
					ApiKey:         &settingstypes.ApiKey{},
					IssuerSettings: &settingstypes.IssuerSettings{},
				},
				nil,
			)

		sut := grpc.NewSettingsService(settingsSrv)

		ret, err := sut.GetSettings(ctx, &identity_service_sdk_go.GetSettingsRequest{})

		assert.NoError(t, err)
		assert.NotNil(t, ret.ApiKey)
		assert.NotNil(t, ret.IssuerSettings)
	})

	t.Run("should propagate error when core service fails", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().GetSettings(ctx).Return(nil, errSettingsUnexpected)

		sut := grpc.NewSettingsService(settingsSrv)

		_, err := sut.GetSettings(ctx, &identity_service_sdk_go.GetSettingsRequest{})

		assert.ErrorIs(t, err, errSettingsUnexpected)
	})
}

func TestSettingsService_SetApiKey(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	t.Run("should set api key", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().SetApiKey(ctx).Return(&settingstypes.ApiKey{}, nil)

		sut := grpc.NewSettingsService(settingsSrv)

		ret, err := sut.SetApiKey(ctx, &identity_service_sdk_go.SetApiKeyRequest{})

		assert.NoError(t, err)
		assert.NotNil(t, ret)
	})

	t.Run("should propagate error when core service fails", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().SetApiKey(ctx).Return(nil, errSettingsUnexpected)

		sut := grpc.NewSettingsService(settingsSrv)

		_, err := sut.SetApiKey(ctx, &identity_service_sdk_go.SetApiKeyRequest{})

		assert.ErrorIs(t, err, errSettingsUnexpected)
	})
}

func TestSettingsService_SetIssuer(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	issSettings := &settingstypes.IssuerSettings{
		IdpType:        settingstypes.IDP_TYPE_DUO,
		DuoIdpSettings: &settingstypes.DuoIdpSettings{},
	}

	t.Run("should set an issuer", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().SetIssuerSettings(ctx, issSettings).Return(issSettings, nil)

		sut := grpc.NewSettingsService(settingsSrv)

		ret, err := sut.SetIssuer(ctx, &identity_service_sdk_go.SetIssuerRequest{
			IssuerSettings: &identity_service_sdk_go.IssuerSettings{
				IssuerId:       ptrutil.Ptr(uuid.NewString()),
				IdpType:        ptrutil.Ptr(identity_service_sdk_go.IdpType_IDP_TYPE_DUO),
				DuoIdpSettings: &identity_service_sdk_go.DuoIdpSettings{},
			},
		})

		assert.NoError(t, err)
		assert.NotNil(t, ret)
	})

	t.Run("should propagate error when core service fails", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().SetIssuerSettings(ctx, mock.Anything).Return(nil, errSettingsUnexpected)

		sut := grpc.NewSettingsService(settingsSrv)

		_, err := sut.SetIssuer(ctx, &identity_service_sdk_go.SetIssuerRequest{
			IssuerSettings: &identity_service_sdk_go.IssuerSettings{},
		})

		assert.ErrorIs(t, err, errSettingsUnexpected)
	})
}
