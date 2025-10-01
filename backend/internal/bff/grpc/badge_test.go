// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"errors"
	"testing"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff/grpc"
	grpctesting "github.com/agntcy/identity-service/internal/bff/grpc/testing"
	bffmocks "github.com/agntcy/identity-service/internal/bff/mocks"
	badgetypes "github.com/agntcy/identity-service/internal/core/badge/types"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc/codes"
)

var errBadgeUnexpected = errors.New("failed")

func TestBadgeService_IssueBadge_should_succeed(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		in *identity_service_sdk_go.IssueBadgeRequest
	}{
		"issue a badge for an A2A agent": {
			in: &identity_service_sdk_go.IssueBadgeRequest{
				A2A: &identity_service_sdk_go.IssueA2ABadgeRequest{},
			},
		},
		"issue a badge for an OASF agent": {
			in: &identity_service_sdk_go.IssueBadgeRequest{
				Oasf: &identity_service_sdk_go.IssueOASFBadgeRequest{},
			},
		},
		"issue a badge for an MCP server": {
			in: &identity_service_sdk_go.IssueBadgeRequest{
				Mcp: &identity_service_sdk_go.IssueMcpBadgeRequest{},
			},
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			badgeSrv := bffmocks.NewBadgeService(t)
			badgeSrv.EXPECT().
				IssueBadge(t.Context(), mock.Anything, mock.AnythingOfType("bff.IssueOption")).
				Return(&badgetypes.Badge{}, nil)

			sut := grpc.NewBadgeService(badgeSrv)

			ret, err := sut.IssueBadge(t.Context(), tc.in)

			assert.NoError(t, err)
			assert.NotNil(t, ret)
		})
	}
}

func TestBadgeService_IssueBadge_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	badgeSrv := bffmocks.NewBadgeService(t)
	badgeSrv.EXPECT().IssueBadge(t.Context(), mock.Anything, mock.Anything).Return(nil, errBadgeUnexpected)

	sut := grpc.NewBadgeService(badgeSrv)

	_, err := sut.IssueBadge(t.Context(), &identity_service_sdk_go.IssueBadgeRequest{})

	assert.ErrorIs(t, err, errBadgeUnexpected)
}

func TestBadgeService_IssueBadge_should_return_badrequest_when_req_is_nil(t *testing.T) {
	t.Parallel()

	sut := grpc.NewBadgeService(nil)

	_, err := sut.IssueBadge(t.Context(), nil)

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "Invalid request.")
}

func TestBadgeService_VerifyBadge_should_succeed(t *testing.T) {
	t.Parallel()

	badgeJose := uuid.NewString()

	badgeSrv := bffmocks.NewBadgeService(t)
	badgeSrv.EXPECT().VerifyBadge(t.Context(), &badgeJose).Return(&badgetypes.VerificationResult{}, nil)

	sut := grpc.NewBadgeService(badgeSrv)

	ret, err := sut.VerifyBadge(t.Context(), &identity_service_sdk_go.VerifyBadgeRequest{Badge: badgeJose})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestBadgeService_VerifyBadge_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	badgeJose := uuid.NewString()

	badgeSrv := bffmocks.NewBadgeService(t)
	badgeSrv.EXPECT().VerifyBadge(t.Context(), &badgeJose).Return(nil, errBadgeUnexpected)

	sut := grpc.NewBadgeService(badgeSrv)

	_, err := sut.VerifyBadge(t.Context(), &identity_service_sdk_go.VerifyBadgeRequest{Badge: badgeJose})

	assert.ErrorIs(t, err, errBadgeUnexpected)
}
