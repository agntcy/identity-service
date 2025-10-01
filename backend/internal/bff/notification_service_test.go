// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/agntcy/identity-service/internal/bff"
	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	authtypes "github.com/agntcy/identity-service/internal/core/auth/types/int"
	devicetypes "github.com/agntcy/identity-service/internal/core/device/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	webpushmocks "github.com/agntcy/identity-service/internal/pkg/webpush/mocks"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestNotificationService_SendOTPNotification(t *testing.T) {
	t.Parallel()

	device := &devicetypes.Device{SubscriptionToken: uuid.NewString()}
	session := &authtypes.Session{ID: uuid.NewString()}
	otp := &authtypes.SessionDeviceOTP{Value: uuid.NewString(), DeviceID: uuid.NewString()}
	callerApp := &apptypes.App{Name: ptrutil.Ptr(uuid.NewString())}
	calleeApp := &apptypes.App{Name: ptrutil.Ptr(uuid.NewString())}

	webPushSender := webpushmocks.NewWebPushSender(t)
	sut := bff.NewNotificationService(webPushSender, uuid.NewString(), "pubKey", "privKey")

	t.Run("should send a notifcation for an agent call", func(t *testing.T) {
		t.Parallel()

		toolName := ""

		webPushSender.EXPECT().
			SendWebPushNotification(
				mock.Anything,
				&devicetypes.Notification{
					Body: fmt.Sprintf(
						"The agent '%s' is trying to call the agent '%s'",
						ptrutil.DerefStr(callerApp.Name),
						ptrutil.DerefStr(calleeApp.Name),
					),
					Type: devicetypes.NOTIFICATION_TYPE_APPROVAL_REQUEST,
					ApprovalRequestInfo: &devicetypes.ApprovalRequestInfo{
						CallerApp:        ptrutil.DerefStr(callerApp.Name),
						CalleeApp:        calleeApp.Name,
						ToolName:         &toolName,
						OTP:              otp.Value,
						DeviceID:         otp.DeviceID,
						SessionID:        session.ID,
						TimeoutInSeconds: int(authtypes.SessionDeviceOTPDuration / time.Second),
					},
				},
				mock.Anything,
			).
			Return(nil)

		err := sut.SendOTPNotification(device, session, otp, callerApp, calleeApp, &toolName)

		assert.NoError(t, err)
	})

	t.Run("should send a notifcation for an MCP tool call", func(t *testing.T) {
		t.Parallel()

		toolName := "MCP_TOOL"

		webPushSender.EXPECT().
			SendWebPushNotification(
				mock.Anything,
				&devicetypes.Notification{
					Body: fmt.Sprintf(
						"The agent '%s' is trying to invoke the tool '%s' of the MCP server '%s'",
						ptrutil.DerefStr(callerApp.Name),
						toolName,
						ptrutil.DerefStr(calleeApp.Name),
					),
					Type: devicetypes.NOTIFICATION_TYPE_APPROVAL_REQUEST,
					ApprovalRequestInfo: &devicetypes.ApprovalRequestInfo{
						CallerApp:        ptrutil.DerefStr(callerApp.Name),
						CalleeApp:        calleeApp.Name,
						ToolName:         &toolName,
						OTP:              otp.Value,
						DeviceID:         otp.DeviceID,
						SessionID:        session.ID,
						TimeoutInSeconds: int(authtypes.SessionDeviceOTPDuration / time.Second),
					},
				},
				mock.Anything,
			).
			Return(nil)

		err := sut.SendOTPNotification(device, session, otp, callerApp, calleeApp, &toolName)

		assert.NoError(t, err)
	})

	t.Run("should fail if webpush sender fails to send", func(t *testing.T) {
		t.Parallel()

		webPushSender := webpushmocks.NewWebPushSender(t)
		webPushSender.EXPECT().
			SendWebPushNotification(mock.Anything, mock.Anything, mock.Anything).
			Return(errors.New("failed"))

		sut := bff.NewNotificationService(webPushSender, uuid.NewString(), "pubKey", "privKey")

		err := sut.SendOTPNotification(device, session, otp, callerApp, calleeApp, nil)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed")
	})
}

func TestNotificationService_SendDeviceRegisteredNotification(t *testing.T) {
	t.Parallel()

	webPushSender := webpushmocks.NewWebPushSender(t)
	sut := bff.NewNotificationService(webPushSender, uuid.NewString(), "pubKey", "privKey")

	t.Run("should send without errors", func(t *testing.T) {
		t.Parallel()

		webPushSender.EXPECT().
			SendWebPushNotification(
				mock.Anything,
				&devicetypes.Notification{
					Body: "All is set for Identity Approvals.",
					Type: devicetypes.NOTIFICATION_TYPE_INFO,
				},
				mock.Anything,
			).
			Return(nil)

		err := sut.SendDeviceRegisteredNotification(&devicetypes.Device{})

		assert.NoError(t, err)
	})

	t.Run("should return an error when device is null", func(t *testing.T) {
		t.Parallel()

		err := sut.SendDeviceRegisteredNotification(nil)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "device cannot be null")
	})

	t.Run("should return an error when webpush sender fails", func(t *testing.T) {
		t.Parallel()

		webPushSender := webpushmocks.NewWebPushSender(t)
		webPushSender.EXPECT().
			SendWebPushNotification(mock.Anything, mock.Anything, mock.Anything).
			Return(errors.New("failed"))

		sut := bff.NewNotificationService(webPushSender, uuid.NewString(), "pubKey", "privKey")

		err := sut.SendDeviceRegisteredNotification(&devicetypes.Device{})

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed")
	})
}

func TestNotificationService_SendInfoNotification(t *testing.T) {
	t.Parallel()

	t.Run("should send info notification", func(t *testing.T) {
		t.Parallel()

		message := uuid.NewString()

		webPushSender := webpushmocks.NewWebPushSender(t)
		webPushSender.EXPECT().
			SendWebPushNotification(
				mock.Anything,
				&devicetypes.Notification{
					Body: message,
					Type: devicetypes.NOTIFICATION_TYPE_INFO,
				},
				mock.Anything,
			).
			Return(nil)

		sut := bff.NewNotificationService(webPushSender, uuid.NewString(), "pubKey", "privKey")

		err := sut.SendInfoNotification(&devicetypes.Device{}, message)

		assert.NoError(t, err)
	})

	t.Run("should return an error when device is null", func(t *testing.T) {
		t.Parallel()

		sut := bff.NewNotificationService(nil, "", "", "")

		err := sut.SendInfoNotification(nil, "")

		assert.Error(t, err)
		assert.ErrorContains(t, err, "device cannot be null")
	})

	t.Run("should return an error when webpush sender fails", func(t *testing.T) {
		t.Parallel()

		webPushSender := webpushmocks.NewWebPushSender(t)
		webPushSender.EXPECT().
			SendWebPushNotification(mock.Anything, mock.Anything, mock.Anything).
			Return(errors.New("failed"))

		sut := bff.NewNotificationService(webPushSender, uuid.NewString(), "pubKey", "privKey")

		err := sut.SendInfoNotification(&devicetypes.Device{}, "")

		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed")
	})
}
