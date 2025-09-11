// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	"github.com/outshift/identity-service/internal/bff/grpc"
	grpctesting "github.com/outshift/identity-service/internal/bff/grpc/testing"
	bffmocks "github.com/outshift/identity-service/internal/bff/mocks"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc/codes"
)

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

	t.Run("should return bad request when core service fails", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().GetSettings(ctx).Return(nil, errors.New("failed"))

		sut := grpc.NewSettingsService(settingsSrv)

		_, err := sut.GetSettings(ctx, &identity_service_sdk_go.GetSettingsRequest{})

		grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
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

	t.Run("should return bad request when core service fails", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().SetApiKey(ctx).Return(nil, errors.New("failed"))

		sut := grpc.NewSettingsService(settingsSrv)

		_, err := sut.SetApiKey(ctx, &identity_service_sdk_go.SetApiKeyRequest{})

		grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
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

	t.Run("should return a bad request when request has an invalid issuer settings", func(t *testing.T) {
		t.Parallel()

		sut := grpc.NewSettingsService(nil)

		_, err := sut.SetIssuer(ctx, &identity_service_sdk_go.SetIssuerRequest{
			IssuerSettings: nil,
		})

		grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "issuer settings cannot be nil")
	})

	t.Run("should return a bad request when core service fails", func(t *testing.T) {
		t.Parallel()

		settingsSrv := bffmocks.NewSettingsService(t)
		settingsSrv.EXPECT().SetIssuerSettings(ctx, mock.Anything).Return(nil, errors.New("failed"))

		sut := grpc.NewSettingsService(settingsSrv)

		_, err := sut.SetIssuer(ctx, &identity_service_sdk_go.SetIssuerRequest{
			IssuerSettings: &identity_service_sdk_go.IssuerSettings{},
		})

		grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
	})
}
