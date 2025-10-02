// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Notificationentifier: Apache-2.0

package bff

import (
	"errors"
	"fmt"
	"time"

	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	authtypes "github.com/agntcy/identity-service/internal/core/auth/types/int"
	devicetypes "github.com/agntcy/identity-service/internal/core/device/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/internal/pkg/webpush"
)

const (
	// TTL is the time-to-live for the web push notification.
	ttl = 60

	deviceRegisteredMessage = "All is set for Identity Approvals."
)

type NotificationService interface {
	SendDeviceRegisteredNotification(
		device *devicetypes.Device,
	) error
	SendOTPNotification(
		device *devicetypes.Device,
		session *authtypes.Session,
		otp *authtypes.SessionDeviceOTP,
		callerApp *apptypes.App,
		calleeApp *apptypes.App,
		toolName *string,
	) error
	SendInfoNotification(
		device *devicetypes.Device,
		message string,
	) error
}

type notificationService struct {
	webpushSender   webpush.WebPushSender
	subscriber      string
	vapidPublicKey  string
	vapidPrivateKey string
}

func NewNotificationService(
	webpushSender webpush.WebPushSender,
	subscriber, vapidPublicKey, vapidPrivateKey string,
) NotificationService {
	return &notificationService{
		webpushSender:   webpushSender,
		subscriber:      subscriber,
		vapidPublicKey:  vapidPublicKey,
		vapidPrivateKey: vapidPrivateKey,
	}
}

func (s *notificationService) SendDeviceRegisteredNotification(
	device *devicetypes.Device,
) error {
	if device == nil {
		return errors.New("device cannot be null")
	}

	return s.sendWebPushNotification(
		&device.SubscriptionToken,
		&devicetypes.Notification{
			Body: deviceRegisteredMessage,
			Type: devicetypes.NOTIFICATION_TYPE_INFO,
		},
	)
}

func (s *notificationService) SendOTPNotification(
	device *devicetypes.Device,
	session *authtypes.Session,
	otp *authtypes.SessionDeviceOTP,
	callerApp *apptypes.App,
	calleeApp *apptypes.App,
	toolName *string,
) error {
	if session == nil {
		return nil // No session to notify
	}

	body := fmt.Sprintf(
		"The agent '%s' is trying to call the agent '%s'",
		ptrutil.DerefStr(callerApp.Name),
		ptrutil.DerefStr(calleeApp.Name),
	)

	if toolName != nil && *toolName != "" {
		body = fmt.Sprintf(
			"The agent '%s' is trying to invoke the tool '%s' of the MCP server '%s'",
			ptrutil.DerefStr(callerApp.Name),
			ptrutil.DerefStr(toolName),
			ptrutil.DerefStr(calleeApp.Name),
		)
	}

	return s.sendWebPushNotification(
		&device.SubscriptionToken,
		&devicetypes.Notification{
			Body: body,
			Type: devicetypes.NOTIFICATION_TYPE_APPROVAL_REQUEST,
			ApprovalRequestInfo: &devicetypes.ApprovalRequestInfo{
				CallerApp:        ptrutil.DerefStr(callerApp.Name),
				CalleeApp:        calleeApp.Name,
				ToolName:         toolName,
				OTP:              otp.Value,
				DeviceID:         otp.DeviceID,
				SessionID:        session.ID,
				TimeoutInSeconds: int(authtypes.SessionDeviceOTPDuration / time.Second),
			},
		},
	)
}

func (s *notificationService) SendInfoNotification(
	device *devicetypes.Device,
	message string,
) error {
	if device == nil {
		return errors.New("device cannot be null")
	}

	return s.sendWebPushNotification(
		&device.SubscriptionToken,
		&devicetypes.Notification{
			Body: message,
			Type: devicetypes.NOTIFICATION_TYPE_INFO,
		},
	)
}

func (s *notificationService) sendWebPushNotification(
	subscriptionToken *string,
	notification *devicetypes.Notification,
) error {
	return s.webpushSender.SendWebPushNotification(
		ptrutil.DerefStr(subscriptionToken),
		notification,
		&webpush.Options{
			Subscriber:      s.subscriber,
			VAPIDPublicKey:  s.vapidPublicKey,
			VAPIDPrivateKey: s.vapidPrivateKey,
			TTL:             ttl,
		},
	)
}
