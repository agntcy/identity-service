// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

//go:generate stringer -type=RuleAction

package types

import (
	"strings"
	"time"
)

// Identity Service Policy Task
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

// Identity Service Policy Rule
type Rule struct {
	// A unique identifier for the Rule.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// A human-readable name for the Rule.
	Name string `json:"name,omitempty" protobuf:"bytes,2,opt,name=name"`

	// A human-readable description for the Rule.
	Description string `json:"description,omitempty" protobuf:"bytes,3,opt,name=description"`

	PolicyID string `json:"policy_id,omitempty" protobuf:"bytes,4,opt,name=policy_id"`

	// The tasks that this Rule applies to.
	Tasks []*Task `json:"tasks,omitempty" protobuf:"bytes,5,opt,name=tasks"`

	// The action applied for the rule when calling the specified tasks
	Action RuleAction `json:"action,omitempty" protobuf:"bytes,6,opt,name=action"`

	// Need User Approval for this Rule.
	NeedsApproval bool `json:"needs_approval,omitempty" protobuf:"bytes,7,opt,name=needs_approval"`

	// CreatedAt records the timestamp of when the Rule was initially created
	CreatedAt time.Time `json:"created_at" protobuf:"google.protobuf.Timestamp,8,opt,name=created_at"`

	// UpdatedAt records the timestamp of the last update to the Rule
	UpdatedAt *time.Time `json:"updated_at,omitempty" protobuf:"google.protobuf.Timestamp,9,opt,name=updated_at"`
}

// This function checks whether a Rule is allowing appID to be called.
// If the app is an MCP server than a check against a specific toolName
// is made.
func (r *Rule) CanInvoke(appID, toolName string) bool {
	for _, task := range r.Tasks {
		if r.Action != RULE_ACTION_ALLOW {
			continue
		}

		if task.AppID == appID {
			if task.ToolName == "" ||
				strings.EqualFold(task.ToolName, toolName) {
				return true
			}
		}
	}

	return false
}

// Identity Service Policy.
type Policy struct {
	// A unique identifier for the Policy.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// A human-readable name for the Policy.
	Name string `json:"name,omitempty" protobuf:"bytes,2,opt,name=name"`

	// A human-readable description for the Policy.
	Description string `json:"description,omitempty" protobuf:"bytes,3,opt,name=description"`

	// The requester application that this Policy applies to.
	AssignedTo string `json:"assigned_to,omitempty" protobuf:"bytes,4,opt,name=assigned_to"`

	// All the rules that apply to this Policy.
	Rules []*Rule `json:"rules,omitempty" protobuf:"bytes,5,opt,name=rules"`

	// CreatedAt records the timestamp of when the Policy was initially created
	CreatedAt time.Time `json:"created_at" protobuf:"google.protobuf.Timestamp,6,opt,name=created_at"`

	// UpdatedAt records the timestamp of the last update to the Policy
	UpdatedAt *time.Time `json:"updated_at,omitempty" protobuf:"google.protobuf.Timestamp,7,opt,name=updated_at"`
}

func (p *Policy) CanInvoke(appID, toolName string) *Rule {
	for _, rule := range p.Rules {
		if rule.CanInvoke(appID, toolName) {
			return rule
		}
	}

	return nil
}
