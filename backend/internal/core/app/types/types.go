// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

import "time"

// App Type
type AppType int

const (
	// Unspecified Envelope Type.
	APP_TYPE_UNSPECIFIED AppType = iota

	// Agent A2A App Type.
	APP_TYPE_AGENT_A2A

	// Agent OASF App Type.
	APP_TYPE_AGENT_OASF

	// Agent MCP Server App Type.
	APP_TYPE_MCP_SERVER
)

func (t *AppType) UnmarshalText(text []byte) error {
	switch string(text) {
	case APP_TYPE_AGENT_A2A.String():
		*t = APP_TYPE_AGENT_A2A
	case APP_TYPE_AGENT_OASF.String():
		*t = APP_TYPE_AGENT_OASF
	case APP_TYPE_MCP_SERVER.String():
		*t = APP_TYPE_MCP_SERVER
	default:
		*t = APP_TYPE_UNSPECIFIED
	}

	return nil
}

func (t AppType) MarshalText() ([]byte, error) {
	return []byte(t.String()), nil
}

// Identity Platform App.
type App struct {
	// A unique identifier for the App.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// A human-readable name for the App.
	Name *string `json:"name,omitempty" protobuf:"bytes,2,opt,name=name"`

	// A human-readable description for the App.
	Description *string `json:"description,omitempty" protobuf:"bytes,3,opt,name=description"`

	// The type of the App.
	Type AppType `json:"type,omitempty" protobuf:"bytes,4,opt,name=type"`

	// The DID value
	ResolverMetadataID string `json:"resolver_metadata_id,omitempty" protobuf:"-"`

	ApiKey string `json:"api_key" protobuf:"bytes,5,opt,name=api_key"`

	CreatedAt time.Time  `json:"created_at" protobuf:"google.protobuf.Timestamp,6,opt,name=created_at"`
	UpdatedAt *time.Time `json:"updated_at,omitempty" protobuf:"google.protobuf.Timestamp,7,opt,name=updated_at"`
	DeletedAt *time.Time `json:"-" protobuf:"-"`
}
