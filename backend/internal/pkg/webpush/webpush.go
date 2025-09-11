// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package webpush

import (
	"encoding/json"

	webpushgo "github.com/SherClockHolmes/webpush-go"
	"github.com/outshift/identity-service/internal/pkg/errutil"
)

// Options are config and extra params needed to send a notification
type Options struct {
	Subscriber      string // Sub in VAPID JWT token
	TTL             int    // Set the TTL on the endpoint POST request
	VAPIDPublicKey  string // VAPID public key, passed in VAPID Authorization header
	VAPIDPrivateKey string // VAPID private key, used to sign VAPID JWT token
}

type WebPushSender interface {
	SendWebPushNotification(
		subscriptionToken string,
		notification any,
		options *Options,
	) error
}

type webPushSender struct{}

func NewWebPushSender() WebPushSender {
	return &webPushSender{}
}

func (s *webPushSender) SendWebPushNotification(
	subscriptionToken string,
	notification any,
	options *Options,
) error {
	if subscriptionToken == "" {
		return errutil.Err(
			nil,
			"subscription token cannot be nil",
		)
	}

	// Decode subscription
	var subscription map[string]any

	err := json.Unmarshal([]byte(subscriptionToken), &subscription)
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

	endpoint, ok := subscription["endpoint"].(string)
	if !ok {
		return errutil.Err(
			nil,
			"subscription endpoint not found",
		)
	}

	p256dh, ok := subscription["p256dh"].(string)
	if !ok {
		return errutil.Err(
			nil,
			"subscription keys not found",
		)
	}

	auth, ok := subscription["auth"].(string)
	if !ok {
		return errutil.Err(
			nil,
			"subscription auth key not found",
		)
	}

	// Send Notification
	resp, err := webpushgo.SendNotification(
		payload,
		&webpushgo.Subscription{
			Endpoint: endpoint,
			Keys: webpushgo.Keys{
				P256dh: p256dh,
				Auth:   auth,
			},
		},
		&webpushgo.Options{
			Subscriber:      options.Subscriber,
			VAPIDPublicKey:  options.VAPIDPublicKey,
			VAPIDPrivateKey: options.VAPIDPrivateKey,
			TTL:             options.TTL,
		},
	)
	if err != nil {
		return err
	}

	_ = resp.Body.Close()

	return nil
}
