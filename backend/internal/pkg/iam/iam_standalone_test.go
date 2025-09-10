// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam_test

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/google/uuid"
	iamcoremocks "github.com/outshift/identity-service/internal/core/iam/mocks"
	iamtypes "github.com/outshift/identity-service/internal/core/iam/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/iam"
	iammocks "github.com/outshift/identity-service/internal/pkg/iam/mocks"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

const (
	standaloneApiKeyName   = "default"
	standaloneApiKeyLength = 32
	standaloneTenantID     = "default"
	organization           = "standalone-org"
)

func newSystemUnderTest(iamRepo *iamcoremocks.Repository) *iam.StandaloneClient {
	return iam.NewStandaloneClient(organization, iamRepo, nil)
}

// GetTenantAPIKey

func TestStandaloneClient_GetTenantAPIKey(t *testing.T) {
	t.Parallel()

	expectedApiKey := &iamtypes.APIKey{Secret: ptrutil.Ptr(uuid.NewString())}

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyByTenant(t.Context()).Return(expectedApiKey, nil)

	sut := newSystemUnderTest(iamRepo)

	actualApiKey, err := sut.GetTenantAPIKey(t.Context())

	assert.NoError(t, err)
	assert.Equal(t, expectedApiKey, actualApiKey)
}

func TestStandaloneClient_GetTenantAPIKey_should_fail(t *testing.T) {
	t.Parallel()

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyByTenant(t.Context()).Return(nil, errors.New("failed"))

	sut := newSystemUnderTest(iamRepo)

	_, err := sut.GetTenantAPIKey(t.Context())

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed")
}

// CreateTenantAPIKey

func TestStandaloneClient_CreateTenantAPIKey(t *testing.T) {
	t.Parallel()

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().
		AddAPIKey(t.Context(), mock.Anything).
		RunAndReturn(func(ctx context.Context, apiKey *iamtypes.APIKey) (*iamtypes.APIKey, error) {
			return apiKey, nil
		})

	sut := newSystemUnderTest(iamRepo)

	actualApiKey, err := sut.CreateTenantAPIKey(t.Context())

	assert.NoError(t, err)
	assert.Len(t, *actualApiKey.Secret, standaloneApiKeyLength)
	assert.NotEmpty(t, actualApiKey.ID)
	assert.Equal(t, standaloneApiKeyName, actualApiKey.Name)
}

func TestStandaloneClient_CreateTenantAPIKey_should_fail(t *testing.T) {
	t.Parallel()

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().
		AddAPIKey(t.Context(), mock.Anything).
		Return(nil, errors.New("failed"))

	sut := newSystemUnderTest(iamRepo)

	_, err := sut.CreateTenantAPIKey(t.Context())

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed")
}

// RevokeTenantAPIKey

func TestStandaloneClient_RevokeTenantAPIKey(t *testing.T) {
	t.Parallel()

	apiKey := &iamtypes.APIKey{ID: uuid.NewString()}

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyByTenant(t.Context()).Return(apiKey, nil)
	iamRepo.EXPECT().DeleteAPIKey(t.Context(), apiKey).Return(nil)

	sut := newSystemUnderTest(iamRepo)

	err := sut.RevokeTenantAPIKey(t.Context())

	assert.NoError(t, err)
}

func TestStandaloneClient_RevokeTenantAPIKey_should_fail(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		iamRepo func() *iamcoremocks.Repository
		errMsg  string
	}{
		"should fail when GetAPIKeyByTenant fails": {
			iamRepo: func() *iamcoremocks.Repository {
				iamRepo := iamcoremocks.NewRepository(t)
				iamRepo.EXPECT().GetAPIKeyByTenant(t.Context()).Return(nil, errors.New("failed"))

				return iamRepo
			},
			errMsg: "failed",
		},
		"should fail when DeleteAPIKey fails": {
			iamRepo: func() *iamcoremocks.Repository {
				iamRepo := iamcoremocks.NewRepository(t)
				iamRepo.EXPECT().GetAPIKeyByTenant(t.Context()).Return(&iamtypes.APIKey{}, nil)
				iamRepo.EXPECT().DeleteAPIKey(t.Context(), mock.Anything).Return(errors.New("failed"))

				return iamRepo
			},
			errMsg: "failed",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := newSystemUnderTest(tc.iamRepo())

			err := sut.RevokeTenantAPIKey(t.Context())

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}

// GetAppAPIKey

func TestStandaloneClient_GetAppAPIKey(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()
	expectedApiKey := &iamtypes.APIKey{Secret: ptrutil.Ptr(uuid.NewString())}

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyByApp(t.Context(), appID).Return(expectedApiKey, nil)

	sut := newSystemUnderTest(iamRepo)

	actualApiKey, err := sut.GetAppAPIKey(t.Context(), appID)

	assert.NoError(t, err)
	assert.Equal(t, expectedApiKey, actualApiKey)
}

func TestStandaloneClient_GetAppAPIKey_should_fail(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyByApp(t.Context(), appID).Return(nil, errors.New("failed"))

	sut := newSystemUnderTest(iamRepo)

	_, err := sut.GetAppAPIKey(t.Context(), appID)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed")
}

// CreateAppAPIKey

func TestStandAloneClient_CreateAppAPIKey(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().
		AddAPIKey(t.Context(), mock.Anything).
		RunAndReturn(func(ctx context.Context, apiKey *iamtypes.APIKey) (*iamtypes.APIKey, error) {
			return apiKey, nil
		})

	sut := newSystemUnderTest(iamRepo)

	actualApiKey, err := sut.CreateAppAPIKey(t.Context(), appID)

	assert.NoError(t, err)
	assert.Len(t, *actualApiKey.Secret, standaloneApiKeyLength)
	assert.NotEmpty(t, actualApiKey.ID)
	assert.Equal(t, fmt.Sprintf("%s-%s", standaloneApiKeyName, appID), actualApiKey.Name)
	assert.Equal(t, appID, *actualApiKey.AppID)
}

func TestStandAloneClient_CreateAppAPIKey_should_fail(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().
		AddAPIKey(t.Context(), mock.Anything).
		Return(nil, errors.New("failed"))

	sut := newSystemUnderTest(iamRepo)

	_, err := sut.CreateAppAPIKey(t.Context(), appID)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed")
}

// RevokeAppAPIKey

func TestStandAloneClient_RevokeAppAPIKey(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()
	apiKey := &iamtypes.APIKey{AppID: &appID}

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyByApp(t.Context(), appID).Return(apiKey, nil)
	iamRepo.EXPECT().DeleteAPIKey(t.Context(), apiKey).Return(nil)

	sut := newSystemUnderTest(iamRepo)

	err := sut.RevokeAppAPIKey(t.Context(), appID)

	assert.NoError(t, err)
}

func TestStandaloneClient_RevokeAppAPIKey_should_fail(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		iamRepo func() *iamcoremocks.Repository
		errMsg  string
	}{
		"should fail when GetAPIKeyByApp fails": {
			iamRepo: func() *iamcoremocks.Repository {
				iamRepo := iamcoremocks.NewRepository(t)
				iamRepo.EXPECT().GetAPIKeyByApp(t.Context(), mock.Anything).Return(nil, errors.New("failed"))

				return iamRepo
			},
			errMsg: "failed",
		},
		"should fail when DeleteAPIKey fails": {
			iamRepo: func() *iamcoremocks.Repository {
				iamRepo := iamcoremocks.NewRepository(t)
				iamRepo.EXPECT().GetAPIKeyByApp(t.Context(), mock.Anything).Return(&iamtypes.APIKey{}, nil)
				iamRepo.EXPECT().DeleteAPIKey(t.Context(), mock.Anything).Return(errors.New("failed"))

				return iamRepo
			},
			errMsg: "there was an error revoking the APIKey",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := newSystemUnderTest(tc.iamRepo())

			err := sut.RevokeAppAPIKey(t.Context(), uuid.NewString())

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}

// AuthJwt

func TestStandAloneClient_AuthJwt(t *testing.T) {
	t.Parallel()

	sub := uuid.NewString()
	token := "<TOKEN>"
	validHeader := "Bearer " + token

	jwtVerifier := iammocks.NewJwtVerifier(t)
	jwtVerifier.EXPECT().VerifyAccessToken(token).Return(iam.Claims{"sub": sub}, nil)

	sut := iam.NewStandaloneClient(organization, nil, jwtVerifier)

	actualCtx, err := sut.AuthJwt(context.Background(), validHeader)

	assert.NoError(t, err)

	tenantID, _ := identitycontext.GetTenantID(actualCtx)
	assert.Equal(t, standaloneTenantID, tenantID)

	userID, _ := identitycontext.GetUserID(actualCtx)
	assert.Equal(t, sub, userID)

	orgID, _ := identitycontext.GetOrganizationID(actualCtx)
	assert.Equal(t, organization, orgID)
}

func TestStandAloneClient_AuthJwt_should_fail_if_header_is_invalid(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		header string
		errMsg string
	}{
		"empty header": {
			header: "",
			errMsg: "Authorization header is required",
		},
		"header without token part 1": {
			header: "Bearer ",
			errMsg: "invalid Authorization header format",
		},
		"header without token part 2": {
			header: "Bearer",
			errMsg: "invalid Authorization header format",
		},
		"header without bearer part": {
			header: "token",
			errMsg: "invalid Authorization header format",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := newSystemUnderTest(nil)

			_, err := sut.AuthJwt(t.Context(), tc.header)

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}

func TestStandAloneClient_AuthJwt_should_fail_if_token_verification_fails(t *testing.T) {
	t.Parallel()

	jwtVerifier := iammocks.NewJwtVerifier(t)
	jwtVerifier.EXPECT().VerifyAccessToken(mock.Anything).Return(nil, errors.New("failed"))

	sut := iam.NewStandaloneClient(organization, nil, jwtVerifier)

	_, err := sut.AuthJwt(context.Background(), "Bearer TOKEN")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed")
}

// AuthAPIKey

func TestStandAloneClient_AuthAPIKey_for_tenant(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertTenantID(context.Background(), standaloneTenantID)
	apiKey := uuid.NewString()
	forApp := false

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyBySecret(ctx, apiKey).Return(&iamtypes.APIKey{}, nil)

	sut := newSystemUnderTest(iamRepo)

	actualCtx, err := sut.AuthAPIKey(context.Background(), apiKey, forApp)

	assert.NoError(t, err)
	assert.Equal(t, ctx, actualCtx)
}

func TestStandAloneClient_AuthAPIKey_for_app(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertTenantID(context.Background(), standaloneTenantID)
	apiKey := uuid.NewString()
	forApp := true
	appID := uuid.NewString()
	expectedCtx := identitycontext.InsertAppID(ctx, appID)

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyBySecret(ctx, apiKey).Return(&iamtypes.APIKey{AppID: &appID}, nil)

	sut := newSystemUnderTest(iamRepo)

	actualCtx, err := sut.AuthAPIKey(context.Background(), apiKey, forApp)

	assert.NoError(t, err)
	assert.Equal(t, expectedCtx, actualCtx)
}

func TestStandAloneClient_AuthAPIKey_for_tenant_should_fail_if_api_key_belongs_to_an_app(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertTenantID(context.Background(), standaloneTenantID)
	apiKey := uuid.NewString()
	forApp := false
	appApiKey := &iamtypes.APIKey{AppID: ptrutil.Ptr(uuid.NewString())}

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().
		GetAPIKeyBySecret(ctx, apiKey).
		Return(appApiKey, nil)

	sut := newSystemUnderTest(iamRepo)

	_, err := sut.AuthAPIKey(context.Background(), apiKey, forApp)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "the provided APIKey is not for a tenant")
}

func TestStandAloneClient_AuthAPIKey_for_app_should_fail_if_api_key_belongs_to_a_tenant(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertTenantID(context.Background(), standaloneTenantID)
	apiKey := uuid.NewString()
	forApp := true
	tenantApiKey := &iamtypes.APIKey{AppID: nil}

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().
		GetAPIKeyBySecret(ctx, apiKey).
		Return(tenantApiKey, nil)

	sut := newSystemUnderTest(iamRepo)

	_, err := sut.AuthAPIKey(context.Background(), apiKey, forApp)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "the provided APIKey is not for an app")
}

func TestStandAloneClient_AuthAPIKey_should_return_err_when_api_key_not_found(t *testing.T) {
	t.Parallel()

	iamRepo := iamcoremocks.NewRepository(t)
	iamRepo.EXPECT().GetAPIKeyBySecret(mock.Anything, mock.Anything).Return(nil, errors.New("failed"))

	sut := newSystemUnderTest(iamRepo)

	_, err := sut.AuthAPIKey(context.Background(), uuid.NewString(), false)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "there was an error fetching the APIKey")
}
