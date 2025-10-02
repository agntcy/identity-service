// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"errors"
	"testing"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff/grpc"
	grpctesting "github.com/agntcy/identity-service/internal/bff/grpc/testing"
	bffmocks "github.com/agntcy/identity-service/internal/bff/mocks"
	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	badgetypes "github.com/agntcy/identity-service/internal/core/badge/types"
	policytypes "github.com/agntcy/identity-service/internal/core/policy/types"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/internal/pkg/sorting"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc/codes"
)

var errAppUnexpected = errors.New("failed")

func TestAppService_CreateApp_should_succeed(t *testing.T) {
	t.Parallel()

	var (
		app apptypes.App
		req identity_service_sdk_go.CreateAppRequest
	)

	_ = gofakeit.Struct(&app)
	_ = gofakeit.Struct(&req)

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().CreateApp(t.Context(), mock.Anything).Return(&app, nil)

	sut := grpc.NewAppService(appSrv, nil)

	actual, err := sut.CreateApp(t.Context(), &req)

	assert.NoError(t, err)
	assert.NotNil(t, actual)
}

func TestAppService_CreateApp_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().CreateApp(t.Context(), mock.Anything).Return(nil, errAppUnexpected)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.CreateApp(
		t.Context(),
		&identity_service_sdk_go.CreateAppRequest{App: &identity_service_sdk_go.App{}},
	)

	assert.ErrorIs(t, err, errAppUnexpected)
}

func TestAppService_CreateOasfApp(t *testing.T) {
	t.Parallel()

	t.Run("Should create an app and a badge", func(t *testing.T) {
		t.Parallel()

		var req identity_service_sdk_go.CreateOasfAppRequest

		_ = gofakeit.Struct(&req)

		app := &apptypes.App{
			ID: uuid.NewString(),
		}

		appSrv := bffmocks.NewAppService(t)
		appSrv.EXPECT().CreateAppFromOasfSchema(t.Context(), req.SchemaBase64).Return(app, nil)

		badgeSrv := bffmocks.NewBadgeService(t)
		badgeSrv.EXPECT().
			IssueBadge(t.Context(), app.ID, mock.AnythingOfType("bff.IssueOption")).
			Return(&badgetypes.Badge{}, nil)

		sut := grpc.NewAppService(appSrv, badgeSrv)
		actual, err := sut.CreateOasfApp(t.Context(), &req)

		assert.NoError(t, err)
		assert.NotNil(t, actual)
	})

	t.Run("Should propagate the error returned from the app service", func(t *testing.T) {
		t.Parallel()

		appSrv := bffmocks.NewAppService(t)
		appSrv.EXPECT().CreateAppFromOasfSchema(t.Context(), mock.Anything).Return(nil, errAppUnexpected)

		sut := grpc.NewAppService(appSrv, nil)

		_, err := sut.CreateOasfApp(
			t.Context(),
			&identity_service_sdk_go.CreateOasfAppRequest{},
		)

		assert.ErrorIs(t, err, errAppUnexpected)
	})

	t.Run("Should propagate the error returned from the badge service and delete the app", func(t *testing.T) {
		t.Parallel()

		var req identity_service_sdk_go.CreateOasfAppRequest

		_ = gofakeit.Struct(&req)

		app := &apptypes.App{
			ID: uuid.NewString(),
		}

		appSrv := bffmocks.NewAppService(t)
		appSrv.EXPECT().CreateAppFromOasfSchema(t.Context(), req.SchemaBase64).Return(app, nil)
		appSrv.EXPECT().DeleteApp(t.Context(), app.ID).Return(nil)

		badgeSrv := bffmocks.NewBadgeService(t)
		badgeSrv.EXPECT().
			IssueBadge(t.Context(), app.ID, mock.AnythingOfType("bff.IssueOption")).
			Return(nil, errAppUnexpected)

		sut := grpc.NewAppService(appSrv, badgeSrv)
		_, err := sut.CreateOasfApp(t.Context(), &req)

		assert.ErrorIs(t, err, errAppUnexpected)
	})
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

func TestAppService_ListApps_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().
		ListApps(t.Context(), mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errAppUnexpected)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.ListApps(t.Context(), &identity_service_sdk_go.ListAppsRequest{})

	assert.ErrorIs(t, err, errAppUnexpected)
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

func TestAppService_GetAppsCount_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().CountAllApps(t.Context()).Return(0, errAppUnexpected)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.GetAppsCount(t.Context(), &identity_service_sdk_go.GetAppsCountRequest{})

	assert.ErrorIs(t, err, errAppUnexpected)
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

func TestAppService_UpdateApp_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().UpdateApp(t.Context(), mock.Anything).Return(nil, errAppUnexpected)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.UpdateApp(
		t.Context(),
		&identity_service_sdk_go.UpdateAppRequest{
			App:   &identity_service_sdk_go.App{},
			AppId: appID,
		},
	)

	assert.ErrorIs(t, err, errAppUnexpected)
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

			grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "Application payload is invalid.")
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

func TestAppService_DeleteApp_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().DeleteApp(t.Context(), mock.Anything).Return(errAppUnexpected)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.DeleteApp(
		t.Context(),
		&identity_service_sdk_go.DeleteAppRequest{AppId: uuid.NewString()},
	)

	assert.ErrorIs(t, err, errAppUnexpected)
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

func TestAppService_RefreshAppApiKey_should_propagate_error_when_core_service_fails(
	t *testing.T,
) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().RefreshAppAPIKey(t.Context(), mock.Anything).Return(nil, errAppUnexpected)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.RefreshAppApiKey(
		t.Context(),
		&identity_service_sdk_go.RefreshAppApiKeyRequest{AppId: uuid.NewString()},
	)

	assert.ErrorIs(t, err, errAppUnexpected)
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

func TestAppService_GetBadge_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	// this is the last code I'm writing before removing 4 wisdom teeth in about 2 hours...
	// and it happened to be a unit test...

	badgeSrv := bffmocks.NewBadgeService(t)
	badgeSrv.EXPECT().GetBadge(t.Context(), mock.Anything).Return(nil, errAppUnexpected)

	sut := grpc.NewAppService(nil, badgeSrv)

	_, err := sut.GetBadge(
		t.Context(),
		&identity_service_sdk_go.GetBadgeRequest{AppId: uuid.NewString()},
	)

	assert.ErrorIs(t, err, errAppUnexpected)
}

func TestAppService_GetTasks_should_succeed(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().
		GetTasksPerAppType(t.Context(), mock.Anything).
		Return(map[apptypes.AppType][]*policytypes.Task{
			apptypes.APP_TYPE_AGENT_A2A:  {},
			apptypes.APP_TYPE_MCP_SERVER: {},
		}, nil)

	sut := grpc.NewAppService(appSrv, nil)

	ret, err := sut.GetTasks(t.Context(), &identity_service_sdk_go.GetTasksRequest{})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
	assert.Len(t, ret.Result, 2)
	assert.Contains(t, ret.Result, apptypes.APP_TYPE_AGENT_A2A.String())
	assert.Contains(t, ret.Result, apptypes.APP_TYPE_MCP_SERVER.String())
}

func TestAppService_GetTasks_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().GetTasksPerAppType(t.Context(), mock.Anything).Return(nil, errAppUnexpected)

	sut := grpc.NewAppService(appSrv, nil)

	_, err := sut.GetTasks(t.Context(), &identity_service_sdk_go.GetTasksRequest{})

	assert.ErrorIs(t, err, errAppUnexpected)
}
