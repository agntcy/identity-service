// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

//go:generate stringer -type=NotificationType

package types

import "time"

// APIKey
type APIKey struct {
	// A unique identifier for the APIKey.
	// +field_behavior:OUTPUT_ONLY
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// The ID of the user associated with the APIKey.
	// +field_behavior:REQUIRED
	Name string `json:"name,omitempty" protobuf:"bytes,2,opt,name=name"`

	// The secret key used for authentication.
	// +field_behavior:OUTPUT_ONLY
	Secret *string `json:"secret,omitempty" protobuf:"bytes,3,opt,name=secret"`

	// The ID of the tenant associated with the APIKey.
	// +field_behavior:REQUIRED
	TenantID string `json:"tenant_id,omitempty" protobuf:"bytes,4,opt,name=tenant_id"`

	// The ID of the application associated with the APIKey, if applicable.
	// +field_behavior:OPTIONAL
	AppID *string `json:"app_id,omitempty" protobuf:"bytes,6,opt,name=app_id"`

	// The creation time of the APIKey.
	// +field_behavior:OUTPUT_ONLY
	CreatedAt time.Time `json:"created_at" protobuf:"google.protobuf.Timestamp,7,opt,name=created_at"`

	// UpdatedAt records the timestamp of the last update to the App
	UpdatedAt *time.Time `json:"updated_at,omitempty" protobuf:"-"`

	// DeletedAt records the timestamp of when the App was deleted
	DeletedAt *time.Time `json:"-" protobuf:"-"`
}
