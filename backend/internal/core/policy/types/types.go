// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

//go:generate stringer -type=RuleAction

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

type RuleAction int

const (
	RULE_ACTION_UNSPECIFIED RuleAction = iota
	RULE_ACTION_ALLOW
	RULE_ACTION_DENY
)

func (a *RuleAction) UnmarshalText(text []byte) error {
	switch string(text) {
	case RULE_ACTION_ALLOW.String():
		*a = RULE_ACTION_ALLOW
	case RULE_ACTION_DENY.String():
		*a = RULE_ACTION_DENY
	default:
		*a = RULE_ACTION_UNSPECIFIED
	}

	return nil
}

func (a RuleAction) MarshalText() ([]byte, error) {
	return []byte(a.String()), nil
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

	// The action applied for the rule when calling the specified tasks
	Action RuleAction `json:"action,omitempty"`

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

	// The requester application that this Policy applies to.
	AssignedTo string `json:"assigned_to,omitempty"`

	// All the rules that apply to this Policy.
	Rules []*Rule `json:"rules,omitempty"`
}
