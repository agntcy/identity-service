// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpc

import (
	"context"
	"errors"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
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

	result, err := s.policyService.CreatePolicy(
		ctx,
		in.Name,
		ptrutil.DerefStr(in.Description),
		in.AssignedTo,
	)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromPolicy(result), nil
}

func (s *PolicyService) CreateRule(
	ctx context.Context,
	in *identity_platform_sdk_go.CreateRuleRequest,
) (*identity_platform_sdk_go.Rule, error) {
	if in == nil {
		return nil, grpcutil.BadRequestError(errors.New("request is empty"))
	}

	result, err := s.policyService.CreateRule(
		ctx,
		in.PolicyId,
		in.Name,
		ptrutil.DerefStr(in.Description),
		in.Tasks,
		ptrutil.Derefrence(in.NeedsApproval, false),
	)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromRule(result), nil
}

func (s *PolicyService) DeletePolicy(
	ctx context.Context,
	in *identity_platform_sdk_go.DeletePolicyRequest,
) (*emptypb.Empty, error) {
	err := s.policyService.DeletePolicy(ctx, in.PolicyId)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *PolicyService) DeleteRule(
	ctx context.Context,
	in *identity_platform_sdk_go.DeleteRuleRequest,
) (*emptypb.Empty, error) {
	err := s.policyService.DeleteRule(ctx, in.RuleId, in.PolicyId)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *PolicyService) GetPolicy(
	ctx context.Context,
	in *identity_platform_sdk_go.GetPolicyRequest,
) (*identity_platform_sdk_go.Policy, error) {
	policy, err := s.policyService.GetPolicy(ctx, in.PolicyId)
	if err != nil {
		return nil, grpcutil.NotFoundError(err)
	}

	return converters.FromPolicy(policy), nil
}

func (s *PolicyService) GetRule(
	ctx context.Context,
	in *identity_platform_sdk_go.GetRuleRequest,
) (*identity_platform_sdk_go.Rule, error) {
	rule, err := s.policyService.GetRule(ctx, in.RuleId, in.PolicyId)
	if err != nil {
		return nil, grpcutil.NotFoundError(err)
	}

	return converters.FromRule(rule), nil
}

func (s *PolicyService) ListPolicies(
	ctx context.Context,
	in *identity_platform_sdk_go.ListPoliciesRequest,
) (*identity_platform_sdk_go.ListPoliciesResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        in.Page,
		Size:        in.Size,
		DefaultSize: defaultPageSize,
	}

	policies, err := s.policyService.ListPolicies(ctx, paginationFilter, in.Query)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &identity_platform_sdk_go.ListPoliciesResponse{
		Policies:   convertutil.ConvertSlice(policies.Items, converters.FromPolicy),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, policies),
	}, nil
}

func (s *PolicyService) ListRules(
	ctx context.Context,
	in *identity_platform_sdk_go.ListRulesRequest,
) (*identity_platform_sdk_go.ListRulesResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        in.Page,
		Size:        in.Size,
		DefaultSize: defaultPageSize,
	}

	rules, err := s.policyService.ListRules(ctx, in.PolicyId, paginationFilter, in.Query)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &identity_platform_sdk_go.ListRulesResponse{
		Rules:      convertutil.ConvertSlice(rules.Items, converters.FromRule),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, rules),
	}, nil
}

func (s *PolicyService) UpdatePolicy(
	ctx context.Context,
	in *identity_platform_sdk_go.UpdatePolicyRequest,
) (*identity_platform_sdk_go.Policy, error) {
	if in == nil {
		return nil, grpcutil.BadRequestError(errors.New("request is empty"))
	}

	result, err := s.policyService.UpdatePolicy(
		ctx,
		in.PolicyId,
		in.Name,
		ptrutil.DerefStr(in.Description),
		in.AssignedTo,
	)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromPolicy(result), nil
}

func (p *PolicyService) UpdateRule(
	context.Context,
	*identity_platform_sdk_go.UpdateRuleRequest,
) (*identity_platform_sdk_go.Rule, error) {
	panic("unimplemented")
}
