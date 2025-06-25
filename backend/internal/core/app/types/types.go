// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

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
	ID string `json:"id,omitempty"`

	// A human-readable name for the App.
	Name *string `json:"name,omitempty"`

	// A human-readable description for the App.
	Description *string `json:"description,omitempty"`

	// The type of the App.
	Type AppType `json:"type,omitempty"`

	// The DID value
	ResolverMetadataID string `json:"resolver_metadata_id,omitempty"`

	ApiKey string `json:"api_key"`
}
