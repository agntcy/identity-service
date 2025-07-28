// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

import (
	"time"

	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/internal/pkg/strutil"
	"github.com/google/uuid"
)

// Identity Service Session
type Session struct {
	// A unique identifier for the Session.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// The owner application ID for which the Session is created.
	OwnerAppID string `json:"owner_app_id,omitempty" protobuf:"bytes,2,opt,name=owner_app_id"`

	// The application ID associated with the Session.
	AppID *string `json:"app_id,omitempty" protobuf:"bytes,3,opt,name=app_id"`

	// The tool name associated with the Session.
	ToolName *string `json:"tool_name,omitempty" protobuf:"bytes,4,opt,name=tool_name"`

	// The user ID associated with the Session.
	UserID *string `json:"user_id,omitempty" protobuf:"bytes,5,opt,name=user_id"`

	// The access token associated with the Session.
	AccessToken *string `json:"access_token,omitempty" protobuf:"bytes,6,opt,name=access_token"`

	// The authorization code associated with the Session.
	AuthorizationCode *string `json:"authorization_code,omitempty" protobuf:"bytes,7,opt,name=code"`

	// The creation time of the Session.
	CreatedAt int64 `json:"created_at,omitempty" protobuf:"bytes,8,opt,name=created_at"`

	// The expiration time of the Session.
	ExpiresAt *int64 `json:"expires_at,omitempty" protobuf:"bytes,9,opt,name=expires_at"`
}

func (s *Session) HasExpired() bool {
	return s.ExpiresAt != nil && *s.ExpiresAt <= time.Now().Unix()
}

func (s *Session) Expire() {
	s.ExpiresAt = ptrutil.Ptr(time.Now().Add(-time.Second).Unix())
}

func (s *Session) ExpireAfter(duration time.Duration) {
	s.ExpiresAt = ptrutil.Ptr(time.Now().Add(duration).Unix())
}

type SessionDeviceOTP struct {
	// A unique identifier for the OTP.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// The value of the OTP.
	Value string `json:"value,omitempty" protobuf:"bytes,2,opt,name=value"`

	// The Session that the OTP is generated for.
	SessionID string `json:"session_id,omitempty" protobuf:"bytes,3,opt,name=session_id"`

	// The Device that the OTP is generated for.
	DeviceID string `json:"device_id,omitempty" protobuf:"bytes,4,opt,name=device_id"`

	// The creation time of the OTP.
	CreatedAt int64 `json:"created_at" protobuf:"bytes,5,opt,name=created_at"`

	// The update time of the OTP.
	UpdatedAt *int64 `json:"updated_at" protobuf:"bytes,6,opt,name=updated_at"`

	// The expiration time of the OTP.
	ExpiresAt int64 `json:"expires_at,omitempty" protobuf:"bytes,7,opt,name=expires_at"`

	// A field that tells whether the OTP is approved or denied.
	Approved *bool `json:"approved,omitempty" protobuf:"bytes,8,opt,name=approved"`

	// A field that tells whether the TOP is used or not.
	Used bool `json:"used,omitempty" protobuf:"bytes,9,opt,name=used"`
}

// This function tells us whether the OTP is expired or not
func (o *SessionDeviceOTP) HasExpired() bool {
	now := time.Now().Unix()
	expiresAt := time.Unix(o.ExpiresAt, 0).Add(sessionDeviceOTPDelayWindow).Unix()

	return expiresAt <= now
}

const (
	sessionDeviceOTPLength      = 128
	SessionDeviceOTPDuration    = 60 * time.Second
	sessionDeviceOTPDelayWindow = 1 * time.Second
)

func NewSessionDeviceOTP(sessionID, deviceID string) *SessionDeviceOTP {
	return &SessionDeviceOTP{
		ID:        uuid.NewString(),
		Value:     strutil.Random(sessionDeviceOTPLength),
		SessionID: sessionID,
		DeviceID:  deviceID,
		CreatedAt: time.Now().Unix(),
		ExpiresAt: time.Now().Add(SessionDeviceOTPDuration).Unix(),
		Approved:  nil,
	}
}
