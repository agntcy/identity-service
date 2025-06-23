// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// Identity Platform Policy Rule
type Rule struct {
	// A unique identifier for the App.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// A human-readable name for the App.
	Name *string `json:"name,omitempty" protobuf:"bytes,4,opt,name=name"`

	// A human-readable description for the App.
	Description *string `json:"description,omitempty" protobuf:"bytes,5,opt,name=description"`

	// The requester application that this Rule applies to.
	RequesterID string `json:"requester_id,omitempty" protobuf:"bytes,2,opt,name=requester_id"`

	// The target application that this Rule applies to.
	TargetIDs []string `json:"target_ids,omitempty" protobuf:"bytes,3,opt,name=target_ids"`

	// The allowed tools for this Rule.
	AllowedToolNames []string `json:"allowed_tool_names,omitempty" protobuf:"bytes,7,rep,name=allowed_tool_names"`

	// Need User Approval for this Rule.
	NeedsApproval bool `json:"needs_approval,omitempty" protobuf:"varint,8,opt,name=needs_approval"`
}

// Identity Platform Policy.
type Policy struct {
	// A unique identifier for the App.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// A human-readable name for the App.
	Name *string `json:"name,omitempty" protobuf:"bytes,4,opt,name=name"`

	// A human-readable description for the App.
	Description *string `json:"description,omitempty" protobuf:"bytes,5,opt,name=description"`

	// All the rules that apply to this Policy.
	Rules []Rule `json:"rules,omitempty" protobuf:"bytes,6,rep,name=rules"`
}
