// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Notificationentifier: Apache-2.0

package bff

import (
	"context"
	"encoding/json"
	"fmt"

	webpush "github.com/SherClockHolmes/webpush-go"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	devicetypes "github.com/agntcy/identity-platform/internal/core/device/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
)

const (
	// TTL is the time-to-live for the web push notification.
	ttl         = 60
	testMessage = "All is set for Identity Approvals."
)

type NotificationService interface {
	TestNotification(
		ctx context.Context,
		device *devicetypes.Device,
	) error
	SendOTPNotification(
		ctx context.Context,
		device *devicetypes.Device,
		session *authtypes.Session,
		otp *authtypes.SessionDeviceOTP,
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

func (s *notificationService) TestNotification(
	ctx context.Context,
	device *devicetypes.Device,
) error {
	return s.sendWebPushNotification(
		ctx,
		&device.SubscriptionToken,
		&devicetypes.Notification{
			Body: testMessage,
			Type: devicetypes.NOTIFICATION_TYPE_INFO,
		},
	)
}

func (s *notificationService) SendOTPNotification(
	ctx context.Context,
	device *devicetypes.Device,
	session *authtypes.Session,
	otp *authtypes.SessionDeviceOTP,
) error {
	if session == nil {
		return nil // No session to notify
	}

	return s.sendWebPushNotification(
		ctx,
		&device.SubscriptionToken,
		&devicetypes.Notification{
			Body: fmt.Sprintf("%s is trying to access %s", session.OwnerAppID, ptrutil.DerefStr(session.AppID)),
			Type: devicetypes.NOTIFICATION_TYPE_APPROVAL_REQUEST,
			ApprovalRequestInfo: &devicetypes.ApprovalRequestInfo{
				CallerApp: session.OwnerAppID,
				CalleeApp: session.AppID,
				ToolName:  session.ToolName,
				OTP:       otp.Value,
				DeviceID:  otp.DeviceID,
			},
		},
	)
}

func (s *notificationService) sendWebPushNotification(
	_ context.Context,
	subscriptionToken *string,
	notification *devicetypes.Notification,
) error {
	if subscriptionToken == nil {
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
