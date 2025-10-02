// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpc

import (
	"context"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff"
	"github.com/agntcy/identity-service/internal/bff/grpc/converters"
	policytypes "github.com/agntcy/identity-service/internal/core/policy/types"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"google.golang.org/protobuf/types/known/emptypb"
)

type PolicyService struct {
	policyService bff.PolicyService
}

func NewPolicyService(policyService bff.PolicyService) identity_service_sdk_go.PolicyServiceServer {
	return &PolicyService{
		policyService: policyService,
	}
}

func (s *PolicyService) CreatePolicy(
	ctx context.Context,
	in *identity_service_sdk_go.CreatePolicyRequest,
) (*identity_service_sdk_go.Policy, error) {
	result, err := s.policyService.CreatePolicy(
		ctx,
		in.Name,
		in.GetDescription(),
		in.AssignedTo,
	)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromPolicy(result), nil
}

func (s *PolicyService) CreateRule(
	ctx context.Context,
	in *identity_service_sdk_go.CreateRuleRequest,
) (*identity_service_sdk_go.Rule, error) {
	result, err := s.policyService.CreateRule(
		ctx,
		in.PolicyId,
		in.Name,
		in.GetDescription(),
		in.Tasks,
		in.GetNeedsApproval(),
		policytypes.RuleAction(in.GetAction()),
	)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromRule(result), nil
}

func (s *PolicyService) DeletePolicy(
	ctx context.Context,
	in *identity_service_sdk_go.DeletePolicyRequest,
) (*emptypb.Empty, error) {
	err := s.policyService.DeletePolicy(ctx, in.PolicyId)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *PolicyService) DeleteRule(
	ctx context.Context,
	in *identity_service_sdk_go.DeleteRuleRequest,
) (*emptypb.Empty, error) {
	err := s.policyService.DeleteRule(ctx, in.RuleId, in.PolicyId)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *PolicyService) GetPolicy(
	ctx context.Context,
	in *identity_service_sdk_go.GetPolicyRequest,
) (*identity_service_sdk_go.Policy, error) {
	policy, err := s.policyService.GetPolicy(ctx, in.PolicyId)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromPolicy(policy), nil
}

func (s *PolicyService) GetRule(
	ctx context.Context,
	in *identity_service_sdk_go.GetRuleRequest,
) (*identity_service_sdk_go.Rule, error) {
	rule, err := s.policyService.GetRule(ctx, in.RuleId, in.PolicyId)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromRule(rule), nil
}

func (s *PolicyService) ListPolicies(
	ctx context.Context,
	in *identity_service_sdk_go.ListPoliciesRequest,
) (*identity_service_sdk_go.ListPoliciesResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        in.Page,
		Size:        in.Size,
		DefaultSize: defaultPageSize,
	}

	policies, err := s.policyService.ListPolicies(
		ctx,
		paginationFilter,
		in.Query,
		in.GetAppIds(),
		in.GetRulesForAppIds(),
	)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &identity_service_sdk_go.ListPoliciesResponse{
		Policies:   convertutil.ConvertSlice(policies.Items, converters.FromPolicy),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, policies),
	}, nil
}

func (s *PolicyService) ListRules(
	ctx context.Context,
	in *identity_service_sdk_go.ListRulesRequest,
) (*identity_service_sdk_go.ListRulesResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        in.Page,
		Size:        in.Size,
		DefaultSize: defaultPageSize,
	}

	rules, err := s.policyService.ListRules(ctx, in.PolicyId, paginationFilter, in.Query)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &identity_service_sdk_go.ListRulesResponse{
		Rules:      convertutil.ConvertSlice(rules.Items, converters.FromRule),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, rules),
	}, nil
}

func (s *PolicyService) UpdatePolicy(
	ctx context.Context,
	in *identity_service_sdk_go.UpdatePolicyRequest,
) (*identity_service_sdk_go.Policy, error) {
	policy, err := s.policyService.UpdatePolicy(
		ctx,
		in.PolicyId,
		in.Name,
		in.GetDescription(),
		in.AssignedTo,
	)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromPolicy(policy), nil
}

func (s *PolicyService) UpdateRule(
	ctx context.Context,
	in *identity_service_sdk_go.UpdateRuleRequest,
) (*identity_service_sdk_go.Rule, error) {
	rule, err := s.policyService.UpdateRule(
		ctx,
		in.PolicyId,
		in.RuleId,
		in.Name,
		in.GetDescription(),
		in.Tasks,
		in.GetNeedsApproval(),
		policytypes.RuleAction(in.GetAction()),
	)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromRule(rule), nil
}

func (s *PolicyService) GetPoliciesCount(
	ctx context.Context,
	req *identity_service_sdk_go.GetPoliciesCountRequest,
) (*identity_service_sdk_go.GetPoliciesCountResponse, error) {
	total, err := s.policyService.CountAllPolicies(ctx)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &identity_service_sdk_go.GetPoliciesCountResponse{
		Total: total,
	}, nil
}
