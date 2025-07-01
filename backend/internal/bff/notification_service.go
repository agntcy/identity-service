// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Notificationentifier: Apache-2.0

package bff

import (
	"context"
	"encoding/json"

	webpush "github.com/SherClockHolmes/webpush-go"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

const (
	// TTL is the time-to-live for the web push notification.
	ttl         = 60
	testMessage = "All is set for Identity Approvals."
)

type NotificationService interface {
	TestNotification(
		deviceID string,
		ctx context.Context,
	) error
	SendNotification(
		ctx context.Context,
		session *authtypes.Session,
	) error
}

type notificationService struct {
	subscriber      *string
	vapidPublicKey  *string
	vapidPrivateKey *string
}

func NewNotificationService(
	subscriber, vapidPublicKey, vapidPrivateKey string,
) NotificationService {
	return &notificationService{
		subscriber:      &subscriber,
		vapidPublicKey:  &vapidPublicKey,
		vapidPrivateKey: &vapidPrivateKey,
	}
}

func (s *notificationService) TestNotification(
	deviceID string,
	ctx context.Context,
) error {
	return s.sendWebPushNotification(
		ctx,
		&deviceID,
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

	// This is a placeholder for the actual implementation.
	// In a real-world scenario, this would send a notification based on the session details.
	return nil
}

func (s *notificationService) sendWebPushNotification(
	ctx context.Context,
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
	s := &webpush.Subscription{}
	json.Unmarshal([]byte(subscriptionToken), s)

	// Send Notification
	resp, err := webpush.SendNotification([]byte(message), s, &webpush.Options{
		Subscriber:      s.subscriber,
		VAPIDPublicKey:  s.vapidPublicKey,
		VAPIDPrivateKey: s.vapidPrivateKey,
		TTL:             ttl,
	})
	if err != nil {
		return err
	}

	// Check response
	defer resp.Body.Close()

	return nil
}
