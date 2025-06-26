// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// Identity Platform Policy Task
type Task struct {
	// A unique identifier for the Task.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// A human-readable name for the Task.
	Name *string `json:"name,omitempty" protobuf:"bytes,4,opt,name=name"`

	// An application ID for the Task.
	AppID string `json:"app_id,omitempty" protobuf:"bytes,3,opt,name=app_id"`

	// A tool name for the Task.
	ToolName string `json:"tool_name,omitempty" protobuf:"bytes,2,opt,name=tool_name"`
}

// Identity Platform Policy Rule
type Rule struct {
	// A unique identifier for the App.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// A human-readable name for the App.
	Name *string `json:"name,omitempty" protobuf:"bytes,4,opt,name=name"`

	// A human-readable description for the App.
	Description *string `json:"description,omitempty" protobuf:"bytes,5,opt,name=description"`

	// The requester application that this Rule applies to.
	AssignedTo string `json:"assigned_to,omitempty" protobuf:"bytes,2,opt,name=assigned_to"`

	// The tasks that this Rule applies to.
	Tasks []Task `json:"tasks,omitempty" protobuf:"bytes,3,rep,name=tasks"`

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
