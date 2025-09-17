// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/bff"
	appcore "github.com/outshift/identity-service/internal/core/app"
	appmocks "github.com/outshift/identity-service/internal/core/app/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	policymocks "github.com/outshift/identity-service/internal/core/policy/mocks"
	policytypes "github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// CreatePolicy

func TestPolicyService_CreatePolicy_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	name := "policy_name"
	description := "policy_description"
	assignedTo := uuid.NewString()

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetAppsByID(ctx, []string{assignedTo}).
		Return([]*apptypes.App{{ID: assignedTo}}, nil)

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().Create(ctx, mock.Anything).Return(nil)

	sut := bff.NewPolicyService(appRepo, policyRepo)

	actualPolicy, err := sut.CreatePolicy(ctx, name, description, assignedTo)

	assert.NoError(t, err)
	assert.Equal(t, name, actualPolicy.Name)
	assert.Equal(t, description, actualPolicy.Description)
	assert.Equal(t, assignedTo, actualPolicy.AssignedTo)
	assert.NotEmpty(t, actualPolicy.ID)
	assert.Less(t, actualPolicy.CreatedAt, time.Now().UTC())
}

func TestPolicyService_CreatePolicy_should_return_err_when_name_is_empty(t *testing.T) {
	t.Parallel()

	invalidName := ""

	sut := bff.NewPolicyService(nil, nil)

	_, err := sut.CreatePolicy(context.Background(), invalidName, "", "")

	assert.Error(t, err)
	assert.ErrorIs(t, err, errutil.ValidationFailed("policy.invalidName", "Policy name cannot be empty."))
}

func TestPolicyService_CreatePolicy_should_return_err_when_app_validation_fails(t *testing.T) {
	t.Parallel()

	invalidAssignedTo := uuid.NewString()

	testCases := map[string]*struct {
		buildAppRepo func(t *testing.T, ctx context.Context) appcore.Repository
		errMsg       string
	}{
		"GetAppsByID returns an error": {
			buildAppRepo: func(t *testing.T, ctx context.Context) appcore.Repository {
				t.Helper()

				appRepo := appmocks.NewRepository(t)
				appRepo.EXPECT().GetAppsByID(ctx, mock.Anything).Return(nil, errors.New("error"))
				return appRepo
			},
			errMsg: "failed to fetch apps",
		},
		"App with AssignedID does not exist": {
			buildAppRepo: func(t *testing.T, ctx context.Context) appcore.Repository {
				t.Helper()

				appRepo := appmocks.NewRepository(t)
				appRepo.EXPECT().GetAppsByID(ctx, mock.Anything).Return([]*apptypes.App{}, nil)
				return appRepo
			},
			errMsg: "not found",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			name := "policy_name"
			appRepo := tc.buildAppRepo(t, ctx)
			sut := bff.NewPolicyService(appRepo, nil)

			_, err := sut.CreatePolicy(ctx, name, "", invalidAssignedTo)

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}

// CreateRule

func TestPolicyService_CreateRule_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	name := uuid.NewString()
	description := uuid.NewString()
	action := policytypes.RULE_ACTION_ALLOW
	policy := &policytypes.Policy{ID: uuid.NewString()}
	taskIDs := []string{uuid.NewString(), uuid.NewString()}
	needsApproval := true

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, policy.ID).Return(policy, nil)
	policyRepo.EXPECT().CreateRule(ctx, mock.Anything).Return(nil)
	policyRepo.EXPECT().GetTasksByID(ctx, taskIDs).Return(createTasks(t, taskIDs), nil)

	sut := bff.NewPolicyService(nil, policyRepo)

	actualRule, err := sut.CreateRule(
		ctx,
		policy.ID,
		name,
		description,
		taskIDs,
		needsApproval,
		action,
	)

	assert.NoError(t, err)
	assert.Equal(t, name, actualRule.Name)
	assert.Equal(t, description, actualRule.Description)
	assert.Equal(t, policy.ID, actualRule.PolicyID)
	assert.Equal(t, needsApproval, actualRule.NeedsApproval)
	assert.Equal(t, action, actualRule.Action)
	assert.Greater(t, actualRule.CreatedAt, time.Now().Add(-time.Minute).UTC())
}

func TestPolicyService_CreateRule_should_return_err_when_name_is_empty(t *testing.T) {
	t.Parallel()

	invalidName := ""

	sut := bff.NewPolicyService(nil, nil)

	_, err := sut.CreateRule(
		context.Background(),
		uuid.NewString(),
		invalidName,
		"",
		nil,
		false,
		policytypes.RULE_ACTION_ALLOW,
	)

	assert.Error(t, err)
	assert.ErrorIs(t, err, errutil.ValidationFailed("rule.invalidName", "Rule name cannot be empty."))
}

func TestPolicyService_CreateRule_should_return_err_when_action_is_invalid(t *testing.T) {
	t.Parallel()

	invalidAction := policytypes.RULE_ACTION_UNSPECIFIED

	sut := bff.NewPolicyService(nil, nil)

	_, err := sut.CreateRule(
		context.Background(),
		uuid.NewString(),
		"name",
		"",
		nil,
		false,
		invalidAction,
	)

	assert.Error(t, err)
	assert.ErrorIs(t, err, errutil.ValidationFailed("rule.invalidAction", "Invalid rule action."))
}

func TestPolicyService_CreateRule_should_return_err_when_policy_is_invalid(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	invalidPolicy := "RANDOM_INVALID_POLICY"
	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, invalidPolicy).Return(nil, policycore.ErrPolicyNotFound)
	sut := bff.NewPolicyService(nil, policyRepo)

	_, err := sut.CreateRule(
		context.Background(),
		invalidPolicy,
		"name",
		"",
		nil,
		false,
		policytypes.RULE_ACTION_ALLOW,
	)

	assert.Error(t, err)
	assert.ErrorIs(t, err, bff.ErrPolicyNotFound)
}

func TestPolicyService_CreateRule_should_return_err_when_tasks_are_invalid(t *testing.T) {
	t.Parallel()

	taskIDs := []string{uuid.NewString(), uuid.NewString()}

	testCases := map[string]*struct {
		mockGetTasksByID func(t *testing.T, repo *policymocks.Repository, ctx context.Context)
		errMsg           string
	}{
		"GetTasksByID returns an error": {
			mockGetTasksByID: func(t *testing.T, repo *policymocks.Repository, ctx context.Context) {
				t.Helper()

				repo.EXPECT().GetTasksByID(ctx, mock.Anything).Return(nil, errors.New("error"))
			},
			errMsg: "failed to fetch tasks",
		},
		"Task not found": {
			mockGetTasksByID: func(t *testing.T, repo *policymocks.Repository, ctx context.Context) {
				t.Helper()

				repo.EXPECT().GetTasksByID(ctx, mock.Anything).Return([]*policytypes.Task{}, nil)
			},
			errMsg: fmt.Sprintf("Task with ID %s not found.", taskIDs[0]),
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			name := uuid.NewString()
			description := uuid.NewString()
			action := policytypes.RULE_ACTION_ALLOW
			policy := &policytypes.Policy{ID: uuid.NewString()}
			needsApproval := true

			policyRepo := policymocks.NewRepository(t)
			policyRepo.EXPECT().GetPolicyByID(ctx, policy.ID).Return(policy, nil)
			tc.mockGetTasksByID(t, policyRepo, ctx)

			sut := bff.NewPolicyService(nil, policyRepo)

			_, err := sut.CreateRule(
				ctx,
				policy.ID,
				name,
				description,
				taskIDs,
				needsApproval,
				action,
			)

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}

// DeletePolicy

func TestPolicyService_DeletePolicy_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	policy := &policytypes.Policy{ID: uuid.NewString()}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, policy.ID).Return(policy, nil)
	policyRepo.EXPECT().DeletePolicies(ctx, policy).Return(nil)

	sut := bff.NewPolicyService(nil, policyRepo)

	err := sut.DeletePolicy(ctx, policy.ID)

	assert.NoError(t, err)
}

func TestPolicyService_DeletePolicy_should_return_err_when_policy_invalid(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	invalidPolicyID := uuid.NewString()

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, invalidPolicyID).Return(nil, policycore.ErrPolicyNotFound)

	sut := bff.NewPolicyService(nil, policyRepo)

	err := sut.DeletePolicy(ctx, invalidPolicyID)

	assert.Error(t, err)
	assert.ErrorIs(t, err, bff.ErrPolicyNotFound)
}

func TestPolicyService_DeletePolicy_should_return_err_when_deletion_fails(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	policy := &policytypes.Policy{ID: uuid.NewString()}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, policy.ID).Return(policy, nil)
	policyRepo.EXPECT().DeletePolicies(ctx, policy).Return(errors.New("failed"))

	sut := bff.NewPolicyService(nil, policyRepo)

	err := sut.DeletePolicy(ctx, policy.ID)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to delete policy")
}

// DeleteRule

func TestPolicyService_DeleteRule_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	rule := &policytypes.Rule{ID: uuid.NewString(), PolicyID: uuid.NewString()}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetRuleByID(ctx, rule.ID, rule.PolicyID).Return(rule, nil)
	policyRepo.EXPECT().DeleteRules(ctx, rule).Return(nil)

	sut := bff.NewPolicyService(nil, policyRepo)

	err := sut.DeleteRule(ctx, rule.ID, rule.PolicyID)

	assert.NoError(t, err)
}

func TestPolicyService_DeleteRule_should_return_err_when_rule_is_invalid(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	invalidRuleID := uuid.NewString()

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetRuleByID(ctx, invalidRuleID, mock.Anything).Return(nil, policycore.ErrRuleNotFound)

	sut := bff.NewPolicyService(nil, policyRepo)

	err := sut.DeleteRule(ctx, invalidRuleID, uuid.NewString())

	assert.Error(t, err)
	assert.ErrorIs(t, err, bff.ErrRuleNotFound)
}

func TestPolicyService_DeleteRule_should_return_err_when_deletion_fails(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	rule := &policytypes.Rule{ID: uuid.NewString(), PolicyID: uuid.NewString()}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetRuleByID(ctx, rule.ID, rule.PolicyID).Return(rule, nil)
	policyRepo.EXPECT().DeleteRules(ctx, rule).Return(errors.New("failed"))

	sut := bff.NewPolicyService(nil, policyRepo)

	err := sut.DeleteRule(ctx, rule.ID, rule.PolicyID)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to delete rule")
}

// UpdatePolicy

func TestPolicyService_UpdatePolicy_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	name := "new_name"
	description := "new_description"
	assignedTo := "new_assigned_to"
	policy := &policytypes.Policy{ID: uuid.NewString()}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, policy.ID).Return(policy, nil)
	policyRepo.EXPECT().UpdatePolicy(ctx, policy).Return(nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetAppsByID(ctx, []string{assignedTo}).
		Return([]*apptypes.App{{ID: assignedTo}}, nil)

	sut := bff.NewPolicyService(appRepo, policyRepo)

	actualPolicy, err := sut.UpdatePolicy(ctx, policy.ID, name, description, assignedTo)

	assert.NoError(t, err)
	assert.Equal(t, name, actualPolicy.Name)
	assert.Equal(t, description, actualPolicy.Description)
	assert.Equal(t, assignedTo, actualPolicy.AssignedTo)
	assert.Greater(t, *actualPolicy.UpdatedAt, time.Now().Add(-time.Minute).UTC())
}

func TestPolicyService_UpdatePolicy_should_return_err_when_name_is_empty(t *testing.T) {
	t.Parallel()

	invalidName := ""
	sut := bff.NewPolicyService(nil, nil)

	_, err := sut.UpdatePolicy(context.Background(), uuid.NewString(), invalidName, "", "")

	assert.Error(t, err)
	assert.ErrorIs(t, err, errutil.ValidationFailed("policy.invalidName", "Policy name cannot be empty."))
}

func TestPolicyService_UpdatePolicy_should_return_err_when_policy_is_invalid(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	invalidPolicyID := uuid.NewString()

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, invalidPolicyID).Return(nil, policycore.ErrPolicyNotFound)

	sut := bff.NewPolicyService(nil, policyRepo)

	_, err := sut.UpdatePolicy(ctx, invalidPolicyID, "name", "", "")

	assert.Error(t, err)
	assert.ErrorIs(t, err, bff.ErrPolicyNotFound)
}

func TestPolicyService_UpdatePolicy_should_return_err_when_update_fails(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	assignedTo := "app"
	policy := &policytypes.Policy{ID: uuid.NewString()}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetPolicyByID(ctx, policy.ID).Return(policy, nil)
	policyRepo.EXPECT().UpdatePolicy(ctx, policy).Return(errors.New("failed"))

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetAppsByID(ctx, []string{assignedTo}).
		Return([]*apptypes.App{{ID: assignedTo}}, nil)

	sut := bff.NewPolicyService(appRepo, policyRepo)

	_, err := sut.UpdatePolicy(ctx, policy.ID, "name", "description", assignedTo)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to update the policy")
}

// UpdateRule

func TestPolicyService_UpdateRule_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	name := uuid.NewString()
	description := uuid.NewString()
	action := policytypes.RULE_ACTION_ALLOW
	policy := &policytypes.Policy{ID: uuid.NewString()}
	taskIDs := []string{uuid.NewString(), uuid.NewString()}
	needsApproval := true
	rule := &policytypes.Rule{ID: uuid.NewString(), PolicyID: policy.ID}

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetRuleByID(ctx, rule.ID, policy.ID).Return(rule, nil)
	policyRepo.EXPECT().GetTasksByID(ctx, taskIDs).Return(createTasks(t, taskIDs), nil)
	policyRepo.EXPECT().UpdateRule(ctx, mock.Anything).Return(nil)

	sut := bff.NewPolicyService(nil, policyRepo)

	actualRule, err := sut.UpdateRule(
		ctx,
		policy.ID,
		rule.ID,
		name,
		description,
		taskIDs,
		needsApproval,
		action,
	)

	assert.NoError(t, err)
	assert.Equal(t, name, actualRule.Name)
	assert.Equal(t, description, actualRule.Description)
	assert.Equal(t, policy.ID, actualRule.PolicyID)
	assert.Equal(t, needsApproval, actualRule.NeedsApproval)
	assert.Equal(t, action, actualRule.Action)
	assert.Greater(t, *actualRule.UpdatedAt, time.Now().Add(-time.Minute).UTC())
}

func TestPolicyService_UpdateRule_should_return_err_when_name_is_empty(t *testing.T) {
	t.Parallel()

	invalidName := ""
	sut := bff.NewPolicyService(nil, nil)

	_, err := sut.UpdateRule(
		context.Background(),
		uuid.NewString(),
		uuid.NewString(),
		invalidName,
		"",
		nil,
		false,
		policytypes.RULE_ACTION_ALLOW,
	)

	assert.Error(t, err)
	assert.ErrorIs(t, err, errutil.ValidationFailed("rule.invalidName", "Rule name cannot be empty."))
}

func TestPolicyService_UpdateRule_should_return_err_when_action_is_invalid(t *testing.T) {
	t.Parallel()

	invalidAction := policytypes.RULE_ACTION_UNSPECIFIED

	sut := bff.NewPolicyService(nil, nil)

	_, err := sut.UpdateRule(
		context.Background(),
		uuid.NewString(),
		uuid.NewString(),
		"name",
		"",
		nil,
		false,
		invalidAction,
	)

	assert.Error(t, err)
	assert.ErrorIs(t, err, errutil.ValidationFailed("rule.invalidAction", "Invalid rule action."))
}

func TestPolicyService_UpdateRule_should_return_err_when_rule_is_invalid(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	invalidRuleID := uuid.NewString()

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().GetRuleByID(ctx, invalidRuleID, mock.Anything).Return(nil, policycore.ErrRuleNotFound)

	sut := bff.NewPolicyService(nil, policyRepo)

	_, err := sut.UpdateRule(
		context.Background(),
		uuid.NewString(),
		invalidRuleID,
		"name",
		"",
		nil,
		false,
		policytypes.RULE_ACTION_ALLOW,
	)

	assert.Error(t, err)
	assert.ErrorIs(t, err, bff.ErrRuleNotFound)
}

func createTasks(t *testing.T, ids []string) []*policytypes.Task {
	t.Helper()

	tasks := []*policytypes.Task{}
	for _, id := range ids {
		tasks = append(tasks, &policytypes.Task{ID: id})
	}

	return tasks
}
