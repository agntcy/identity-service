// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpc

import (
	"context"
	"errors"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"google.golang.org/protobuf/types/known/emptypb"
)

type PolicyService struct {
	policyService bff.PolicyService
}

func NewPolicyService(policyService bff.PolicyService) identity_platform_sdk_go.PolicyServiceServer {
	return &PolicyService{
		policyService: policyService,
	}
}

func (s *PolicyService) CreatePolicy(
	ctx context.Context,
	in *identity_platform_sdk_go.CreatePolicyRequest,
) (*identity_platform_sdk_go.Policy, error) {
	if in == nil {
		return nil, grpcutil.BadRequestError(errors.New("request is empty"))
	}

	policy := converters.ToPolicy(in.Policy)

	p, err := s.policyService.CreatePolicy(ctx, policy)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromPolicy(p), nil
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
