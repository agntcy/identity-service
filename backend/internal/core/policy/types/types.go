// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// Identity Platform Policy Task
type Task struct {
	// A unique identifier for the Task.
	ID string `json:"id,omitempty"`

	// A human-readable name for the Task.
	Name string `json:"name,omitempty"`

	// A human-readable description for the Task.
	Description string `json:"description,omitempty"`

	// An application ID for the Task.
	AppID string `json:"app_id,omitempty"`

	// A tool name for the Task.
	ToolName string `json:"tool_name,omitempty"`
}

// Identity Platform Policy Rule
type Rule struct {
	// A unique identifier for the Rule.
	ID string `json:"id,omitempty"`

	// A human-readable name for the Rule.
	Name string `json:"name,omitempty"`

	// A human-readable description for the Rule.
	Description string `json:"description,omitempty"`

	PolicyID string `json:"policy_id,omitempty"`

	// The tasks that this Rule applies to.
	Tasks []*Task `json:"tasks,omitempty"`

	// Need User Approval for this Rule.
	NeedsApproval bool `json:"needs_approval,omitempty"`
}

// Identity Platform Policy.
type Policy struct {
	// A unique identifier for the Policy.
	ID string `json:"id,omitempty"`

	// A human-readable name for the Policy.
	Name string `json:"name,omitempty"`

	// A human-readable description for the Policy.
	Description string `json:"description,omitempty"`

	// The requester application that this Rule applies to.
	AssignedTo string `json:"assigned_to,omitempty"`

	// All the rules that apply to this Policy.
	Rules []*Rule `json:"rules,omitempty"`
}
