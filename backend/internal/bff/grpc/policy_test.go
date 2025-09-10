// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	"github.com/outshift/identity-service/internal/bff/grpc"
	grpctesting "github.com/outshift/identity-service/internal/bff/grpc/testing"
	bffmocks "github.com/outshift/identity-service/internal/bff/mocks"
	policytypes "github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc/codes"
)

// CreatePolicy

func TestPolicyService_CreatePolicy_should_succeed(t *testing.T) {
	t.Parallel()

	name := uuid.NewString()
	description := uuid.NewString()
	assignedTo := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		CreatePolicy(t.Context(), name, description, assignedTo).
		Return(&policytypes.Policy{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.CreatePolicy(t.Context(), &identity_service_sdk_go.CreatePolicyRequest{
		Name:        name,
		Description: &description,
		AssignedTo:  assignedTo,
	})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestPolicyService_CreatePolicy_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		CreatePolicy(t.Context(), mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.CreatePolicy(t.Context(), &identity_service_sdk_go.CreatePolicyRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

// CreateRule

func TestPolicyService_CreateRule_should_succeed(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()
	name := uuid.NewString()
	description := uuid.NewString()
	taskIDs := []string{uuid.NewString()}
	needsApproval := true
	action := identity_service_sdk_go.RuleAction_RULE_ACTION_ALLOW

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		CreateRule(t.Context(), policyID, name, description, taskIDs, needsApproval, policytypes.RuleAction(action)).
		Return(&policytypes.Rule{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.CreateRule(t.Context(), &identity_service_sdk_go.CreateRuleRequest{
		PolicyId:      policyID,
		Name:          name,
		Description:   &description,
		Tasks:         taskIDs,
		NeedsApproval: &needsApproval,
		Action:        action,
	})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestPolicyService_CreateRule_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		CreateRule(t.Context(), mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.CreateRule(t.Context(), &identity_service_sdk_go.CreateRuleRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

// DeletePolicy

func TestPolicyService_DeletePolicy_should_succeed(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().DeletePolicy(t.Context(), policyID).Return(nil)

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.DeletePolicy(t.Context(), &identity_service_sdk_go.DeletePolicyRequest{PolicyId: policyID})

	assert.NoError(t, err)
}

func TestPolicyService_DeletePolicy_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().DeletePolicy(t.Context(), policyID).Return(errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.DeletePolicy(t.Context(), &identity_service_sdk_go.DeletePolicyRequest{PolicyId: policyID})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

// DeleteRule

func TestPolicyService_DeleteRule_should_succeed(t *testing.T) {
	t.Parallel()

	ruleID := uuid.NewString()
	policyID := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().DeleteRule(t.Context(), ruleID, policyID).Return(nil)

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.DeleteRule(
		t.Context(),
		&identity_service_sdk_go.DeleteRuleRequest{PolicyId: policyID, RuleId: ruleID},
	)

	assert.NoError(t, err)
}

func TestPolicyService_DeleteRule_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().DeleteRule(t.Context(), mock.Anything, mock.Anything).Return(errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.DeleteRule(t.Context(), &identity_service_sdk_go.DeleteRuleRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

// GetPolicy

func TestPolicyService_GetPolicy_should_succeed(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().GetPolicy(t.Context(), policyID).Return(&policytypes.Policy{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.GetPolicy(t.Context(), &identity_service_sdk_go.GetPolicyRequest{PolicyId: policyID})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestPolicyService_GetPolicy_should_return_notfound_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().GetPolicy(t.Context(), policyID).Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.GetPolicy(t.Context(), &identity_service_sdk_go.GetPolicyRequest{PolicyId: policyID})

	grpctesting.AssertGrpcError(t, err, codes.NotFound, "failed")
}

// GetRule

func TestPolicyService_GetRule_should_succeed(t *testing.T) {
	t.Parallel()

	ruleID := uuid.NewString()
	policyID := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().GetRule(t.Context(), ruleID, policyID).Return(&policytypes.Rule{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.GetRule(t.Context(), &identity_service_sdk_go.GetRuleRequest{PolicyId: policyID, RuleId: ruleID})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestPolicyService_GetRule_should_return_notfound_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().GetRule(t.Context(), mock.Anything, mock.Anything).Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.GetRule(t.Context(), &identity_service_sdk_go.GetRuleRequest{})

	grpctesting.AssertGrpcError(t, err, codes.NotFound, "failed")
}

// ListPolicies

func TestPolicyService_ListPolicies_should_succeed(t *testing.T) {
	t.Parallel()

	paginationFilter := pagination.PaginationFilter{
		Page:        ptrutil.Ptr(int32(123)),
		Size:        ptrutil.Ptr(int32(123)),
		DefaultSize: int32(20),
	}
	query := uuid.NewString()
	appIDs := []string{uuid.NewString()}
	rulesForAppIDs := []string{uuid.NewString()}

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		ListPolicies(t.Context(), paginationFilter, &query, appIDs, rulesForAppIDs).
		Return(&pagination.Pageable[policytypes.Policy]{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.ListPolicies(t.Context(), &identity_service_sdk_go.ListPoliciesRequest{
		Page:           paginationFilter.Page,
		Size:           paginationFilter.Size,
		Query:          &query,
		AppIds:         appIDs,
		RulesForAppIds: rulesForAppIDs,
	})

	assert.NoError(t, err)
	assert.NotNil(t, ret.Policies)
	assert.NotNil(t, ret.Pagination)
}

func TestPolicyService_ListPolicies_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		ListPolicies(t.Context(), mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.ListPolicies(t.Context(), &identity_service_sdk_go.ListPoliciesRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

// ListRules

func TestPolicyService_ListRules_should_succeed(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()
	paginationFilter := pagination.PaginationFilter{
		Page:        ptrutil.Ptr(int32(123)),
		Size:        ptrutil.Ptr(int32(123)),
		DefaultSize: int32(20),
	}
	query := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		ListRules(t.Context(), policyID, paginationFilter, &query).
		Return(&pagination.Pageable[policytypes.Rule]{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.ListRules(t.Context(), &identity_service_sdk_go.ListRulesRequest{
		PolicyId: policyID,
		Page:     paginationFilter.Page,
		Size:     paginationFilter.Size,
		Query:    &query,
	})

	assert.NoError(t, err)
	assert.NotNil(t, ret.Rules)
	assert.NotNil(t, ret.Pagination)
}

func TestPolicyService_ListRules_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		ListRules(t.Context(), mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.ListRules(t.Context(), &identity_service_sdk_go.ListRulesRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

// UpdatePolicy

func TestPolicyService_UpdatePolicy_should_succeed(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()
	name := uuid.NewString()
	description := uuid.NewString()
	assignedTo := uuid.NewString()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		UpdatePolicy(t.Context(), policyID, name, description, assignedTo).
		Return(&policytypes.Policy{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.UpdatePolicy(t.Context(), &identity_service_sdk_go.UpdatePolicyRequest{
		PolicyId:    policyID,
		Name:        name,
		Description: &description,
		AssignedTo:  assignedTo,
	})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestPolicyService_UpdatePolicy_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		UpdatePolicy(t.Context(), mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.UpdatePolicy(t.Context(), &identity_service_sdk_go.UpdatePolicyRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

// UpdateRule

func TestPolicyService_UpdateRule_should_succeed(t *testing.T) {
	t.Parallel()

	policyID := uuid.NewString()
	ruleID := uuid.NewString()
	name := uuid.NewString()
	description := uuid.NewString()
	tasks := []string{uuid.NewString()}
	needsApproval := false
	action := identity_service_sdk_go.RuleAction_RULE_ACTION_ALLOW

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		UpdateRule(t.Context(), policyID, ruleID, name, description, tasks, needsApproval, policytypes.RuleAction(action)).
		Return(&policytypes.Rule{}, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.UpdateRule(t.Context(), &identity_service_sdk_go.UpdateRuleRequest{
		RuleId:        ruleID,
		PolicyId:      policyID,
		Name:          name,
		Description:   &description,
		Tasks:         tasks,
		NeedsApproval: &needsApproval,
		Action:        action,
	})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestPolicyService_UpdateRule_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		UpdateRule(
			t.Context(),
			mock.Anything,
			mock.Anything,
			mock.Anything,
			mock.Anything,
			mock.Anything,
			mock.Anything,
			mock.Anything,
		).
		Return(nil, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.UpdateRule(t.Context(), &identity_service_sdk_go.UpdateRuleRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestPolicyService_GetPoliciesCount_should_succeed(t *testing.T) {
	t.Parallel()

	total := int64(100)

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		CountAllPolicies(t.Context()).
		Return(total, nil)

	sut := grpc.NewPolicyService(policySrv)

	ret, err := sut.GetPoliciesCount(t.Context(), &identity_service_sdk_go.GetPoliciesCountRequest{})

	assert.NoError(t, err)
	assert.Equal(t, total, ret.Total)
}

func TestPolicyService_GetPoliciesCount_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	policySrv := bffmocks.NewPolicyService(t)
	policySrv.EXPECT().
		CountAllPolicies(t.Context()).
		Return(0, errors.New("failed"))

	sut := grpc.NewPolicyService(policySrv)

	_, err := sut.GetPoliciesCount(t.Context(), &identity_service_sdk_go.GetPoliciesCountRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}
