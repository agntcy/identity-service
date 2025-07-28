// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package types_test

import (
	"fmt"
	"testing"

	"github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/stretchr/testify/assert"
)

func TestPolicyCanInvoke_Should_Pass(t *testing.T) {
	t.Parallel()

	apps := []string{"app_1", "app_2", "app_3"}

	policy := types.Policy{
		AssignedTo: "assignedTo",
		Rules: []*types.Rule{
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID: apps[0],
					},
				},
			},
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID: apps[1],
					},
				},
			},
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID: apps[2],
					},
				},
			},
		},
	}

	for _, app := range apps {
		t.Run(fmt.Sprintf("test policy against app %s", app), func(t *testing.T) {
			t.Parallel()

			assert.NotNil(t, policy.CanInvoke(app, ""))
		})
	}
}

func TestPolicyCanInvoke_Should_Pass_With_ToolName(t *testing.T) {
	t.Parallel()

	apps := []string{"app_1", "app_2", "app_3"}
	tools := []string{"tool_1", "tool_2", "tool_3"}

	policy := types.Policy{
		AssignedTo: "assignedTo",
		Rules: []*types.Rule{
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID:    apps[0],
						ToolName: tools[0],
					},
				},
			},
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID:    apps[1],
						ToolName: tools[1],
					},
				},
			},
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID:    apps[2],
						ToolName: tools[2],
					},
				},
			},
		},
	}

	for idx := range apps {
		t.Run(fmt.Sprintf("test policy against app %s", apps[idx]), func(t *testing.T) {
			t.Parallel()

			assert.NotNil(t, policy.CanInvoke(apps[idx], tools[idx]))
		})
	}
}

func TestPolicyCanInvoke_Should_Fail_For_Invalid_App(t *testing.T) {
	t.Parallel()

	policy := types.Policy{
		AssignedTo: "assignedTo",
		Rules: []*types.Rule{
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID: "app",
					},
				},
			},
		},
	}
	invalidAppID := "invalid_app"

	assert.Nil(t, policy.CanInvoke(invalidAppID, ""))
}

func TestPolicyCanInvoke_Should_Fail_For_Invalid_Tool(t *testing.T) {
	t.Parallel()

	app := "app"

	policy := types.Policy{
		AssignedTo: "assignedTo",
		Rules: []*types.Rule{
			{
				Action: types.RULE_ACTION_ALLOW,
				Tasks: []*types.Task{
					{
						AppID:    app,
						ToolName: "toolname",
					},
				},
			},
		},
	}
	invalidToolName := "invalid_tool"

	assert.Nil(t, policy.CanInvoke(app, invalidToolName))
}
