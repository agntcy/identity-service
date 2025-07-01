// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Notificationentifier: Apache-2.0

package bff

import (
	"context"
	"encoding/json"

	webpush "github.com/SherClockHolmes/webpush-go"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	devicetypes "github.com/agntcy/identity-platform/internal/core/device/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
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
	SendNotification(
		ctx context.Context,
		session *authtypes.Session,
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
		testMessage,
	)
}

func (s *notificationService) SendNotification(
	ctx context.Context,
	session *authtypes.Session,
) error {
	if session == nil {
		return nil // No session to notify
	}

	// TODO: Add notification logic and wait here

	return nil
}

func (s *notificationService) sendWebPushNotification(
	_ context.Context,
	subscriptionToken *string,
	message string,
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

	// Send Notification
	resp, err := webpush.SendNotification([]byte(message), &webpush.Subscription{
		Endpoint: subscription["endpoint"].(string),
		Keys: webpush.Keys{
			P256dh: subscription["p256dh"].(string),
			Auth:   subscription["auth"].(string),
		},
	}, &webpush.Options{
		Subscriber:      s.subscriber,
		VAPIDPublicKey:  s.vapidPublicKey,
		VAPIDPrivateKey: s.vapidPrivateKey,
		TTL:             ttl,
	})
	if err != nil {
		return err
	}

	// Check response
	_ = resp.Body.Close()

	return nil
}
