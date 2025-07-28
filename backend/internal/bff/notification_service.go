// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Notificationentifier: Apache-2.0

package bff

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	webpush "github.com/SherClockHolmes/webpush-go"
	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	authtypes "github.com/agntcy/identity-service/internal/core/auth/types"
	devicetypes "github.com/agntcy/identity-service/internal/core/device/types"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
)

const (
	// TTL is the time-to-live for the web push notification.
	ttl = 60

	deviceRegisteredMessage = "All is set for Identity Approvals."
)

type NotificationService interface {
	SendDeviceRegisteredNotification(
		ctx context.Context,
		device *devicetypes.Device,
	) error
	SendOTPNotification(
		ctx context.Context,
		device *devicetypes.Device,
		session *authtypes.Session,
		otp *authtypes.SessionDeviceOTP,
		callerApp *apptypes.App,
		calleeApp *apptypes.App,
		toolName *string,
	) error
	SendInfoNotification(
		ctx context.Context,
		device *devicetypes.Device,
		message string,
	) error
}

type notificationService struct {
	subscriber      string
	vapidPublicKey  string
	vapidPrivateKey string
}

func NewNotificationService(
	subscriber, vapidPublicKey, vapidPrivateKey string,
) NotificationService {
	return &notificationService{
		subscriber:      subscriber,
		vapidPublicKey:  vapidPublicKey,
		vapidPrivateKey: vapidPrivateKey,
	}
}

func (s *notificationService) SendDeviceRegisteredNotification(
	ctx context.Context,
	device *devicetypes.Device,
) error {
	return s.sendWebPushNotification(
		ctx,
		&device.SubscriptionToken,
		&devicetypes.Notification{
			Body: deviceRegisteredMessage,
			Type: devicetypes.NOTIFICATION_TYPE_INFO,
		},
	)
}

func (s *notificationService) SendOTPNotification(
	ctx context.Context,
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
		ctx,
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
	ctx context.Context,
	device *devicetypes.Device,
	message string,
) error {
	return s.sendWebPushNotification(
		ctx,
		&device.SubscriptionToken,
		&devicetypes.Notification{
			Body: message,
			Type: devicetypes.NOTIFICATION_TYPE_INFO,
		},
	)
}

func (s *notificationService) sendWebPushNotification(
	_ context.Context,
	subscriptionToken *string,
	notification *devicetypes.Notification,
) error {
	if subscriptionToken == nil || *subscriptionToken == "" {
		return errutil.Err(
			nil,
			"subscription token cannot be nil",
		)
	}

	// Decode subscription
	var subscription map[string]interface{}

	err := json.Unmarshal([]byte(*subscriptionToken), &subscription)
	if err != nil {
		return errutil.Err(
			err,
			"failed to unmarshal subscription token",
		)
	}

	payload, err := json.Marshal(notification)
	if err != nil {
		return errutil.Err(err, "failed to marshal notification payload")
	}

	// Send Notification
	resp, err := webpush.SendNotification(
		payload,
		&webpush.Subscription{
			Endpoint: subscription["endpoint"].(string),
			Keys: webpush.Keys{
				P256dh: subscription["p256dh"].(string),
				Auth:   subscription["auth"].(string),
			},
		},
		&webpush.Options{
			Subscriber:      s.subscriber,
			VAPIDPublicKey:  s.vapidPublicKey,
			VAPIDPrivateKey: s.vapidPrivateKey,
			TTL:             ttl,
		},
	)
	if err != nil {
		return err
	}

	// Check response
	_ = resp.Body.Close()

	return nil
}
