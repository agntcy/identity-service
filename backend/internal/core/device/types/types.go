// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// Devices used for user approval
type Device struct {
	// A unique identifier for the Device.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// User ID associated with the Device.
	UserID string `json:"user_id,omitempty" protobuf:"bytes,2,opt,name=user_id"`

	// Subscription Token for the Device.
	SubscriptionToken string `json:"subscription_token,omitempty" protobuf:"bytes,3,opt,name=subscription_token"`
}
