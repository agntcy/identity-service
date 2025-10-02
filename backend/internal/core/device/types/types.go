// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

//go:generate stringer -type=NotificationType

package types

import "time"

// Devices used for user approval
type Device struct {
	// A unique identifier for the Device.
	// +field_behavior:OUTPUT_ONLY
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// User ID associated with the Device.
	// +field_behavior:OPTIONAL
	UserID string `json:"user_id,omitempty" protobuf:"bytes,2,opt,name=user_id"`

	// Subscription Token for the Device.
	// +field_behavior:OPTIONAL
	SubscriptionToken string `json:"subscription_token,omitempty" protobuf:"bytes,3,opt,name=subscription_token"`

	// The device human-readable name.
	// +field_behavior:OPTIONAL
	Name string `json:"name,omitempty" protobuf:"bytes,4,opt,name=name"`

	// The creation time of the Device.
	// +field_behavior:OUTPUT_ONLY
	CreatedAt time.Time `json:"created_at" protobuf:"google.protobuf.Timestamp,5,opt,name=created_at"`
}

type NotificationType int

const (
	NOTIFICATION_TYPE_UNSPECIFIED NotificationType = iota
	NOTIFICATION_TYPE_INFO
	NOTIFICATION_TYPE_APPROVAL_REQUEST
)

func (t *NotificationType) UnmarshalText(text []byte) error {
	switch string(text) {
	case NOTIFICATION_TYPE_INFO.String():
		*t = NOTIFICATION_TYPE_INFO
	case NOTIFICATION_TYPE_APPROVAL_REQUEST.String():
		*t = NOTIFICATION_TYPE_APPROVAL_REQUEST
	default:
		*t = NOTIFICATION_TYPE_UNSPECIFIED
	}

	return nil
}

func (t NotificationType) MarshalText() ([]byte, error) {
	return []byte(t.String()), nil
}

type ApprovalRequestInfo struct {
	CallerApp        string  `json:"caller_app,omitempty"         protobuf:"bytes,1,opt,name=caller_app"`
	CalleeApp        *string `json:"callee_app,omitempty"         protobuf:"bytes,2,opt,name=callee_app"`
	ToolName         *string `json:"tool_name,omitempty"          protobuf:"bytes,3,opt,name=tool_name"`
	OTP              string  `json:"otp,omitempty"                protobuf:"bytes,4,opt,name=otp"`
	DeviceID         string  `json:"device_id,omitempty"          protobuf:"bytes,5,opt,name=device_id"`
	SessionID        string  `json:"session_id,omitempty"         protobuf:"bytes,6,opt,name=session_id"`
	TimeoutInSeconds int     `json:"timeout_in_seconds,omitempty" protobuf:"bytes,7,opt,name=timeout_in_seconds"`
}

type Notification struct {
	Body                string               `json:"body,omitempty"                  protobuf:"bytes,1,opt,name=body"`
	Type                NotificationType     `json:"type,omitempty"                  protobuf:"bytes,2,opt,name=type"`
	ApprovalRequestInfo *ApprovalRequestInfo `json:"approval_request_info,omitempty" protobuf:"bytes,3,opt,name=approval_request_info"` //nolint:lll // long def
}
