// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Authentifier: Apache-2.0

package policy_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	policymocks "github.com/outshift/identity-service/internal/core/policy/mocks"
	"github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/stretchr/testify/assert"
)

func TestEvaluation_Evaluate_should_pass(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	calledApp := &apptypes.App{ID: uuid.NewString()}
	callingAppID := uuid.NewString()
	toolName := ""
	policies := []*types.Policy{
		{
			AssignedTo: callingAppID,
			Rules: []*types.Rule{
				{
					ID:     "my_rule!",
					Action: types.RULE_ACTION_ALLOW,
					Tasks: []*types.Task{
						{
							AppID: calledApp.ID,
						},
					},
				},
			},
		},
	}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPoliciesByAppID(ctx, callingAppID).Return(policies, nil)

	sut := policycore.NewEvaluator(policyRepo)

	rule, err := sut.Evaluate(ctx, calledApp, callingAppID, toolName)

	assert.NoError(t, err)
	assert.NotNil(t, rule)
	assert.Equal(t, "my_rule!", rule.ID)
}

func TestEvaluation_Evaluate_should_not_pass(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	calledApp := &apptypes.App{ID: uuid.NewString()}
	callingAppID := uuid.NewString()
	toolName := ""
	emptyPolicies := []*types.Policy{}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPoliciesByAppID(ctx, callingAppID).Return(emptyPolicies, nil)

	sut := policycore.NewEvaluator(policyRepo)

	_, err := sut.Evaluate(ctx, calledApp, callingAppID, toolName)

	assert.Error(t, err)
	assert.ErrorIs(t, err, errutil.Unauthorized("auth.unauthorized", "The application is unauthorized to make a call."))
}

func TestEvaluation_Evaluate_should_return_err_when_input_is_not_valid(t *testing.T) {
	t.Parallel()

	t.Run("should fails when called app is an MCP server and toolName is not specified", func(t *testing.T) {
		t.Parallel()

		ctx := context.Background()
		calledApp := &apptypes.App{Type: apptypes.APP_TYPE_MCP_SERVER}
		emptyToolName := ""
		sut := policycore.NewEvaluator(nil)

		_, err := sut.Evaluate(ctx, calledApp, "", emptyToolName)

		assert.Error(t, err)
		assert.ErrorIs(t, err, errutil.ValidationFailed("auth.emptyToolName", "Please provide a tool name."))
	})
}
