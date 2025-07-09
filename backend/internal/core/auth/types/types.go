// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// Identity Platform Session
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
