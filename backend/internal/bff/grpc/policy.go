// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpc

import (
	"context"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"google.golang.org/protobuf/types/known/emptypb"
)

type PolicyService struct {
}

func NewPolicyService() identity_platform_sdk_go.PolicyServiceServer {
	return &PolicyService{}
}

func (p *PolicyService) CreatePolicy(
	context.Context,
	*identity_platform_sdk_go.CreatePolicyRequest,
) (*identity_platform_sdk_go.Policy, error) {
	panic("unimplemented")
}

func (p *PolicyService) CreateRule(
	context.Context,
	*identity_platform_sdk_go.CreateRuleRequest,
) (*identity_platform_sdk_go.Rule, error) {
	panic("unimplemented")
}

func (p *PolicyService) DeletePolicy(
	context.Context,
	*identity_platform_sdk_go.DeletePolicyRequest,
) (*emptypb.Empty, error) {
	panic("unimplemented")
}

func (p *PolicyService) DeleteRule(
	context.Context,
	*identity_platform_sdk_go.DeleteRuleRequest,
) (*emptypb.Empty, error) {
	panic("unimplemented")
}

func (p *PolicyService) GetPolicy(
	context.Context,
	*identity_platform_sdk_go.GetPolicyRequest,
) (*identity_platform_sdk_go.Policy, error) {
	panic("unimplemented")
}

func (p *PolicyService) GetRule(
	context.Context,
	*identity_platform_sdk_go.GetRuleRequest,
) (*identity_platform_sdk_go.Rule, error) {
	panic("unimplemented")
}

func (p *PolicyService) ListPolicies(
	context.Context,
	*identity_platform_sdk_go.ListPoliciesRequest,
) (*identity_platform_sdk_go.ListPoliciesResponse, error) {
	panic("unimplemented")
}

func (p *PolicyService) ListRules(
	context.Context,
	*identity_platform_sdk_go.ListRulesRequest,
) (*identity_platform_sdk_go.ListRulesResponse, error) {
	panic("unimplemented")
}

func (p *PolicyService) UpdatePolicy(
	context.Context,
	*identity_platform_sdk_go.UpdatePolicyRequest,
) (*identity_platform_sdk_go.Policy, error) {
	panic("unimplemented")
}

func (p *PolicyService) UpdateRule(
	context.Context,
	*identity_platform_sdk_go.UpdateRuleRequest,
) (*identity_platform_sdk_go.Rule, error) {
	panic("unimplemented")
}
