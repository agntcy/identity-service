// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package types_test

import (
	"testing"
	"time"

	"github.com/google/uuid"
	types "github.com/outshift/identity-service/internal/core/auth/types/int"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
)

func TestSession_ValidateTool(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		session        *types.Session
		name           string
		expectedResult bool
	}{
		"nil session tool name should pass validation": {
			session:        &types.Session{ToolName: nil},
			name:           "does_not_matter",
			expectedResult: true,
		},
		"empty session tool name should pass validation": {
			session:        &types.Session{ToolName: ptrutil.Ptr("")},
			name:           "does_not_matter",
			expectedResult: true,
		},
		"session tool name equals to input name should pass validation": {
			session:        &types.Session{ToolName: ptrutil.Ptr("name1")},
			name:           "name1",
			expectedResult: true,
		},
		"session tool name not equals to input name should not pass validation": {
			session:        &types.Session{ToolName: ptrutil.Ptr("name1")},
			name:           "name2",
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actual := tc.session.ValidateTool(tc.name)

			assert.Equal(t, tc.expectedResult, actual)
		})
	}
}

func TestSession_ValidateApp(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		session        *types.Session
		appID          string
		expectedResult bool
	}{
		"a session with nil AppID should pass validation": {
			session:        &types.Session{AppID: nil},
			appID:          "does_not_matter",
			expectedResult: true,
		},
		"a session with an AppID equals to input ID should pass validation": {
			session:        &types.Session{AppID: ptrutil.Ptr("app_id")},
			appID:          "app_id",
			expectedResult: true,
		},
		"a session with an AppID not equals to input ID should not pass validation": {
			session:        &types.Session{AppID: ptrutil.Ptr("app_id")},
			appID:          uuid.NewString(),
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actual := tc.session.ValidateApp(tc.appID)

			assert.Equal(t, tc.expectedResult, actual)
		})
	}
}

func TestSession_HasExpired(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		expiredAt      *int64
		expectedResult bool
	}{
		"should return true when expiredAt is not nil and less than now": {
			expiredAt:      ptrutil.Ptr(time.Now().Add(-time.Minute).Unix()),
			expectedResult: true,
		},
		"should return false when expiredAt is nil": {
			expiredAt:      nil,
			expectedResult: false,
		},
		"should return false when expiredAt is greater than now": {
			expiredAt:      ptrutil.Ptr(time.Now().Add(time.Minute).Unix()),
			expectedResult: false,
		},
		"should return true when expiredAt is now": {
			expiredAt:      ptrutil.Ptr(time.Now().Unix()),
			expectedResult: true,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := types.Session{ExpiresAt: tc.expiredAt}

			actual := sut.HasExpired()

			assert.Equal(t, tc.expectedResult, actual)
		})
	}
}

func TestSession_Expire(t *testing.T) {
	t.Parallel()

	sut := types.Session{}

	sut.Expire()

	assert.NotNil(t, sut.ExpiresAt)
	assert.Less(t, *sut.ExpiresAt, time.Now().Unix())
}

func TestSession_ExpireAfter(t *testing.T) {
	t.Parallel()

	sut := types.Session{}

	sut.ExpireAfter(time.Minute)

	assert.Greater(t, *sut.ExpiresAt, time.Now().Unix())
}

func TestSessionDeviceOTP_HasExpired(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		expiresAt      int64
		expectedResult bool
	}{
		"should return false when expiresAt is greater than now": {
			expiresAt:      time.Now().Add(time.Minute).Unix(),
			expectedResult: false,
		},
		"should return true when expiresAt is less than now": {
			expiresAt:      time.Now().Add(-time.Minute).Unix(),
			expectedResult: true,
		},
		"should return false when expiresAt is still in the OTP delay window": {
			expiresAt:      time.Now().Unix(),
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := types.NewSessionDeviceOTP("SESSION_ID", "DEVICE_ID")
			sut.ExpiresAt = tc.expiresAt

			actual := sut.HasExpired()

			assert.Equal(t, tc.expectedResult, actual)
		})
	}
}

func TestSessionDeviceOTP_IsDenied(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		approved       *bool
		expectedResult bool
	}{
		"should return true when approved equals false": {
			approved:       ptrutil.Ptr(false),
			expectedResult: true,
		},
		"should return false when approved equals true": {
			approved:       ptrutil.Ptr(true),
			expectedResult: false,
		},
		"should return false when approved is nil": {
			approved:       nil,
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := types.NewSessionDeviceOTP("SESSION_ID", "DEVICE_ID")
			sut.Approved = tc.approved

			assert.Equal(t, tc.expectedResult, sut.IsDenied())
		})
	}
}

func TestSessionDeviceOTP_IsApproved(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		approved       *bool
		expectedResult bool
	}{
		"should return true when approved equals true": {
			approved:       ptrutil.Ptr(true),
			expectedResult: true,
		},
		"should return false when approved equals false": {
			approved:       ptrutil.Ptr(false),
			expectedResult: false,
		},
		"should return false when approved is nil": {
			approved:       nil,
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := types.NewSessionDeviceOTP("SESSION_ID", "DEVICE_ID")
			sut.Approved = tc.approved

			assert.Equal(t, tc.expectedResult, sut.IsApproved())
		})
	}
}
