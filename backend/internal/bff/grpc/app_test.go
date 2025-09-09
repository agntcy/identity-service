// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"errors"
	"testing"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/google/uuid"
	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	"github.com/outshift/identity-service/internal/bff/grpc"
	bffmocks "github.com/outshift/identity-service/internal/bff/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	badgetypes "github.com/outshift/identity-service/internal/core/badge/types"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/sorting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestAppService_CreateApp_should_succeed(t *testing.T) {
	t.Parallel()

	var app apptypes.App
	var req identity_service_sdk_go.CreateAppRequest

	_ = gofakeit.Struct(&app)
	_ = gofakeit.Struct(&req)

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().CreateApp(t.Context(), mock.Anything).Return(&app, nil)

	sut := grpc.NewAppService(appSrv, nil)

	actual, err := sut.CreateApp(t.Context(), &req)

	assert.NoError(t, err)
	assert.NotNil(t, actual)
}

func TestAppService_CreateApp_should_return_badrequest_when_req_is_invalid(t *testing.T) {
	t.Parallel()

	testCases := map[string]*identity_service_sdk_go.CreateAppRequest{
		"nil request":   nil,
		"empty request": {},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := grpc.NewAppService(nil, nil)

			_, err := sut.CreateApp(t.Context(), tc)

			assert.Error(t, err)
			assertGrpcError(t, err, codes.InvalidArgument, "app cannot be nil")
		})
	}
}

func TestAppService_CreateApp_should_return_badrequest_when_core_services_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().CreateApp(t.Context(), mock.Anything).Return(nil, errors.New("failed"))

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.CreateApp(
		t.Context(),
		&identity_service_sdk_go.CreateAppRequest{App: &identity_service_sdk_go.App{}},
	)

	assert.Error(t, err)
	assertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestAppService_ListApps_should_succeed(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().
		ListApps(t.Context(), mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(&pagination.Pageable[apptypes.App]{
			Items: []*apptypes.App{{}},
			Total: 1,
		}, nil)

	sut := grpc.NewAppService(appSrv, nil)

	actual, err := sut.ListApps(t.Context(), &identity_service_sdk_go.ListAppsRequest{})

	assert.NoError(t, err)
	assert.Len(t, actual.Apps, 1)
	assert.Equal(t, int64(1), actual.Pagination.Total)
}

func TestAppService_ListApps_should_parse_parameters(t *testing.T) {
	t.Parallel()

	pf := pagination.PaginationFilter{
		Page:        ptrutil.Ptr(int32(2)),
		Size:        ptrutil.Ptr(int32(20)),
		DefaultSize: int32(20),
	}
	sortBy := sorting.Sorting{
		SortColumn: ptrutil.Ptr(uuid.NewString()),
		SortDesc:   ptrutil.Ptr(true),
	}
	appTypes := []apptypes.AppType{apptypes.APP_TYPE_AGENT_A2A}
	query := uuid.NewString()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().
		ListApps(t.Context(), pf, &query, appTypes, sortBy).
		Return(&pagination.Pageable[apptypes.App]{
			Items: []*apptypes.App{{}},
			Total: 1,
		}, nil)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.ListApps(t.Context(), &identity_service_sdk_go.ListAppsRequest{
		Page:  pf.Page,
		Size:  pf.Size,
		Query: &query,
		Types: []identity_service_sdk_go.AppType{
			identity_service_sdk_go.AppType_APP_TYPE_AGENT_A2A,
		},
		SortColumn: sortBy.SortColumn,
		SortDesc:   sortBy.SortDesc,
	})

	assert.NoError(t, err)
}

func TestAppService_ListApps_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().
		ListApps(t.Context(), mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errors.New("failed"))

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.ListApps(t.Context(), &identity_service_sdk_go.ListAppsRequest{})

	assert.Error(t, err)
	assertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestAppService_GetAppsCount_should_succeed(t *testing.T) {
	t.Parallel()

	count := int64(200)

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().CountAllApps(t.Context()).Return(count, nil)

	sut := grpc.NewAppService(appSrv, nil)

	actual, err := sut.GetAppsCount(t.Context(), &identity_service_sdk_go.GetAppsCountRequest{})

	assert.NoError(t, err)
	assert.Equal(t, count, actual.Total)
}

func TestAppService_GetAppsCount_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().CountAllApps(t.Context()).Return(0, errors.New("failed"))

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.GetAppsCount(t.Context(), &identity_service_sdk_go.GetAppsCountRequest{})

	assert.Error(t, err)
	assertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestAppService_GetApp_should_succeed(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().GetApp(t.Context(), appID).Return(&apptypes.App{ID: appID}, nil)

	sut := grpc.NewAppService(appSrv, nil)

	actual, err := sut.GetApp(t.Context(), &identity_service_sdk_go.GetAppRequest{AppId: appID})

	assert.NoError(t, err)
	assert.Equal(t, appID, *actual.Id)
}

func TestAppService_GetApp_should_return_badrequest_when_req_has_no_app_id(t *testing.T) {
	t.Parallel()

	testCases := map[string]*identity_service_sdk_go.GetAppRequest{
		"req is nil":        nil,
		"req has no app ID": {},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := grpc.NewAppService(nil, nil)

			_, err := sut.GetApp(t.Context(), tc)

			assert.Error(t, err)
			assertGrpcError(t, err, codes.InvalidArgument, "app ID cannot be empty")
		})
	}
}

func TestAppService_UpdateApp_should_succeed(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()
	app := &apptypes.App{
		ID:          appID,
		Name:        ptrutil.Ptr(""),
		Description: ptrutil.Ptr(""),
	}

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().UpdateApp(t.Context(), app).Return(app, nil)

	sut := grpc.NewAppService(appSrv, nil)

	actual, err := sut.UpdateApp(
		t.Context(),
		&identity_service_sdk_go.UpdateAppRequest{
			App:   &identity_service_sdk_go.App{},
			AppId: appID,
		},
	)

	assert.NoError(t, err)
	assert.Equal(t, appID, actual.GetId())
}

func TestAppService_UpdateApp_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().UpdateApp(t.Context(), mock.Anything).Return(nil, errors.New("failed"))

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.UpdateApp(
		t.Context(),
		&identity_service_sdk_go.UpdateAppRequest{
			App:   &identity_service_sdk_go.App{},
			AppId: appID,
		},
	)

	assert.Error(t, err)
	assertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestAppService_UpdateApp_should_return_badrequest_when_req_is_invalid(t *testing.T) {
	t.Parallel()

	testCases := map[string]*identity_service_sdk_go.UpdateAppRequest{
		"req is nil":   nil,
		"req is empty": {},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := grpc.NewAppService(nil, nil)

			_, err := sut.UpdateApp(t.Context(), tc)

			assert.Error(t, err)
			assertGrpcError(t, err, codes.InvalidArgument, "app cannot be nil")
		})
	}
}

func TestAppService_DeleteApp_should_succeed(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().DeleteApp(t.Context(), appID).Return(nil)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.DeleteApp(t.Context(), &identity_service_sdk_go.DeleteAppRequest{AppId: appID})

	assert.NoError(t, err)
}

func TestAppService_DeleteApp_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().DeleteApp(t.Context(), mock.Anything).Return(errors.New("failed"))

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.DeleteApp(
		t.Context(),
		&identity_service_sdk_go.DeleteAppRequest{AppId: uuid.NewString()},
	)

	assert.Error(t, err)
	assertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestAppService_RefreshAppApiKey_should_succeed(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().RefreshAppAPIKey(t.Context(), appID).Return(&apptypes.App{}, nil)

	sut := grpc.NewAppService(appSrv, nil)

	ret, err := sut.RefreshAppApiKey(
		t.Context(),
		&identity_service_sdk_go.RefreshAppApiKeyRequest{AppId: appID},
	)

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestAppService_RefreshAppApiKey_should_return_badrequest_when_request_is_invalid(
	t *testing.T,
) {
	t.Parallel()

	testCases := map[string]*identity_service_sdk_go.RefreshAppApiKeyRequest{
		"req is nil":   nil,
		"req is empty": {},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := grpc.NewAppService(nil, nil)

			_, err := sut.RefreshAppApiKey(t.Context(), tc)

			assert.Error(t, err)
			assertGrpcError(t, err, codes.InvalidArgument, "app ID cannot be empty")
		})
	}
}

func TestAppService_RefreshAppApiKey_should_return_badrequest_when_core_service_fails(
	t *testing.T,
) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().RefreshAppAPIKey(t.Context(), mock.Anything).Return(nil, errors.New("failed"))

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.RefreshAppApiKey(
		t.Context(),
		&identity_service_sdk_go.RefreshAppApiKeyRequest{AppId: uuid.NewString()},
	)

	assert.Error(t, err)
	assertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestAppService_GetBadge_should_succeed(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	badgeSrv := bffmocks.NewBadgeService(t)
	badgeSrv.EXPECT().GetBadge(t.Context(), appID).Return(&badgetypes.Badge{}, nil)

	sut := grpc.NewAppService(nil, badgeSrv)

	ret, err := sut.GetBadge(t.Context(), &identity_service_sdk_go.GetBadgeRequest{AppId: appID})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestAppService_GetBadge_should_return_notfound_when_core_service_fails(t *testing.T) {
	t.Parallel()

	// this is the last code I'm writing before removing 4 wisdom teeth in about 2 hours...
	// and it happened to be a unit test...

	badgeSrv := bffmocks.NewBadgeService(t)
	badgeSrv.EXPECT().GetBadge(t.Context(), mock.Anything).Return(nil, errors.New("failed"))

	sut := grpc.NewAppService(nil, badgeSrv)

	_, err := sut.GetBadge(
		t.Context(),
		&identity_service_sdk_go.GetBadgeRequest{AppId: uuid.NewString()},
	)

	assert.Error(t, err)
	assertGrpcError(t, err, codes.NotFound, "failed")
}

func assertGrpcError(t *testing.T, err error, code codes.Code, msg string) {
	t.Helper()

	s, ok := status.FromError(err)
	assert.True(t, ok)

	assert.Equal(t, code, s.Code())
	assert.Equal(t, msg, s.Message())
}
