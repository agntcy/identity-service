// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package bff

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	appcore "github.com/outshift/identity-service/internal/core/app"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	policytypes "github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/strutil"
)

type PolicyService interface {
	CreatePolicy(
		ctx context.Context,
		name, description, assignedTo string,
	) (*policytypes.Policy, error)
	CreateRule(
		ctx context.Context,
		policyID, name, description string,
		taskIDs []string,
		needsApproval bool,
		action policytypes.RuleAction,
	) (*policytypes.Rule, error)
	DeletePolicy(ctx context.Context, id string) error
	DeleteRule(ctx context.Context, ruleID string, policyID string) error
	GetPolicy(ctx context.Context, id string) (*policytypes.Policy, error)
	GetRule(ctx context.Context, ruleID string, policyID string) (*policytypes.Rule, error)
	ListPolicies(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
		appIDs []string,
		rulesForAppIDs []string,
	) (*pagination.Pageable[policytypes.Policy], error)
	ListRules(
		ctx context.Context,
		policyID string,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[policytypes.Rule], error)
	UpdatePolicy(
		ctx context.Context,
		id, name, description, assignedTo string,
	) (*policytypes.Policy, error)
	UpdateRule(
		ctx context.Context,
		policyID string,
		ruleID string,
		name string,
		description string,
		taskIDs []string,
		needsApproval bool,
		action policytypes.RuleAction,
	) (*policytypes.Rule, error)
	CountAllPolicies(ctx context.Context) (int64, error)
}

var (
	ErrPolicyNotFound  = errutil.NotFound("policy.notFound", "Policy not found.")
	ErrRuleNotFound    = errutil.NotFound("rule.notFound", "Rule not found.")
	ErrInvalidPolicyID = errutil.ValidationFailed("policy.idInvalid", "Invalid policy ID.")
	ErrInvalidRuleID   = errutil.ValidationFailed("rule.idInvalid", "Invalid rule ID.")
)

type policyService struct {
	appRepository    appcore.Repository
	policyRepository policycore.Repository
}

func NewPolicyService(
	appRepository appcore.Repository,
	policyRepository policycore.Repository,
) PolicyService {
	return &policyService{
		appRepository:    appRepository,
		policyRepository: policyRepository,
	}
}

func (s *policyService) CreatePolicy(
	ctx context.Context,
	name, description, assignedTo string,
) (*policytypes.Policy, error) {
	if name == "" {
		return nil, errutil.ValidationFailed("policy.invalidName", "Policy name cannot be empty.")
	}

	err := s.validateAppIDs(ctx, assignedTo)
	if err != nil {
		return nil, err
	}

	policy := &policytypes.Policy{
		ID:          uuid.NewString(),
		Name:        name,
		Description: description,
		AssignedTo:  assignedTo,
		CreatedAt:   time.Now().UTC(),
	}

	err = s.policyRepository.Create(ctx, policy)
	if err != nil {
		return nil, fmt.Errorf("repository in CreatePolicy failed to create policy: %w", err)
	}

	return policy, nil
}

func (s *policyService) CreateRule(
	ctx context.Context,
	policyID, name, description string,
	taskIDs []string,
	needsApproval bool,
	action policytypes.RuleAction,
) (*policytypes.Rule, error) {
	if policyID == "" {
		return nil, ErrInvalidPolicyID
	}

	if name == "" {
		return nil, errutil.ValidationFailed("rule.invalidName", "Rule name cannot be empty.")
	}

	if action == policytypes.RULE_ACTION_UNSPECIFIED {
		return nil, errutil.ValidationFailed("rule.invalidAction", "Invalid rule action.")
	}

	policy, err := s.policyRepository.GetPolicyByID(ctx, policyID)
	if err != nil {
		if errors.Is(err, policycore.ErrPolicyNotFound) {
			return nil, ErrPolicyNotFound
		}

		return nil, fmt.Errorf("repository in CreateRule failed to find policy %s: %w", policyID, err)
	}

	tasks, err := s.validateTasks(ctx, taskIDs)
	if err != nil {
		return nil, err
	}

	rule := &policytypes.Rule{
		ID:            uuid.NewString(),
		Name:          name,
		Description:   description,
		PolicyID:      policy.ID,
		Tasks:         tasks,
		NeedsApproval: needsApproval,
		Action:        action,
		CreatedAt:     time.Now().UTC(),
	}

	err = s.policyRepository.CreateRule(ctx, rule)
	if err != nil {
		return nil, fmt.Errorf("repository in CreateRule failed to create rule for policy %s: %w", policyID, err)
	}

	return rule, nil
}

func (s *policyService) DeletePolicy(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidPolicyID
	}

	policy, err := s.policyRepository.GetPolicyByID(ctx, id)
	if err != nil {
		if errors.Is(err, policycore.ErrPolicyNotFound) {
			return ErrPolicyNotFound
		}

		return fmt.Errorf("repository in DeletePolicy failed to find policy %s: %w", id, err)
	}

	err = s.policyRepository.DeletePolicies(ctx, policy)
	if err != nil {
		return fmt.Errorf("repository in DeletePolicy failed to delete policy: %w", err)
	}

	return nil
}

func (s *policyService) DeleteRule(ctx context.Context, ruleID, policyID string) error {
	if policyID == "" {
		return ErrInvalidPolicyID
	}

	if ruleID == "" {
		return ErrInvalidRuleID
	}

	rule, err := s.policyRepository.GetRuleByID(ctx, ruleID, policyID)
	if err != nil {
		if errors.Is(err, policycore.ErrRuleNotFound) {
			return ErrRuleNotFound
		}

		return fmt.Errorf("repository in DeleteRule failed to find rule %s: %w", ruleID, err)
	}

	err = s.policyRepository.DeleteRules(ctx, rule)
	if err != nil {
		return fmt.Errorf("repository in DeleteRule failed to delete rule %s: %w", ruleID, err)
	}

	return nil
}

func (s *policyService) GetPolicy(ctx context.Context, id string) (*policytypes.Policy, error) {
	if id == "" {
		return nil, ErrInvalidPolicyID
	}

	policy, err := s.policyRepository.GetPolicyByID(ctx, id)
	if err != nil {
		if errors.Is(err, policycore.ErrPolicyNotFound) {
			return nil, ErrPolicyNotFound
		}

		return nil, fmt.Errorf("repository in GetPolicy failed to get policy %s: %w", id, err)
	}

	return policy, nil
}

func (s *policyService) GetRule(
	ctx context.Context,
	ruleID, policyID string,
) (*policytypes.Rule, error) {
	if policyID == "" {
		return nil, ErrInvalidPolicyID
	}

	if ruleID == "" {
		return nil, ErrInvalidRuleID
	}

	rule, err := s.policyRepository.GetRuleByID(ctx, ruleID, policyID)
	if err != nil {
		if errors.Is(err, policycore.ErrRuleNotFound) {
			return nil, ErrRuleNotFound
		}

		return nil, fmt.Errorf("repository in GetRule failed to find rule %s: %w", ruleID, err)
	}

	return rule, nil
}

func (s *policyService) ListPolicies(
	ctx context.Context,
	paginationFilter pagination.PaginationFilter,
	query *string,
	appIDs []string,
	rulesForAppIDs []string,
) (*pagination.Pageable[policytypes.Policy], error) {
	appIDs = strutil.TrimSlice(appIDs)
	rulesForAppIDs = strutil.TrimSlice(rulesForAppIDs)

	policies, err := s.policyRepository.GetAllPolicies(ctx, paginationFilter, query, appIDs, rulesForAppIDs)
	if err != nil {
		return nil, fmt.Errorf("repository in ListPolicies failed to get policies: %w", err)
	}

	return policies, nil
}

func (s *policyService) ListRules(
	ctx context.Context,
	policyID string,
	paginationFilter pagination.PaginationFilter,
	query *string,
) (*pagination.Pageable[policytypes.Rule], error) {
	if policyID == "" {
		return nil, ErrInvalidPolicyID
	}

	rules, err := s.policyRepository.GetAllRules(ctx, policyID, paginationFilter, query)
	if err != nil {
		return nil, fmt.Errorf("repository in ListRules failed to get rules for policy %s: %w", policyID, err)
	}

	return rules, nil
}

func (s *policyService) UpdatePolicy(
	ctx context.Context,
	id string,
	name string,
	description string,
	assignedTo string,
) (*policytypes.Policy, error) {
	if id == "" {
		return nil, ErrInvalidPolicyID
	}

	if name == "" {
		return nil, errutil.ValidationFailed("policy.invalidName", "Policy name cannot be empty.")
	}

	policy, err := s.policyRepository.GetPolicyByID(ctx, id)
	if err != nil {
		if errors.Is(err, policycore.ErrPolicyNotFound) {
			return nil, ErrPolicyNotFound
		}

		return nil, fmt.Errorf("repository in UpdatePolicy failed to find policy %s: %w", id, err)
	}

	err = s.validateAppIDs(ctx, assignedTo)
	if err != nil {
		return nil, err
	}

	policy.Name = name
	policy.Description = description
	policy.AssignedTo = assignedTo
	policy.UpdatedAt = ptrutil.Ptr(time.Now().UTC())

	err = s.policyRepository.UpdatePolicy(ctx, policy)
	if err != nil {
		return nil, fmt.Errorf("repository in UpdatePolicy failed to update the policy %s: %w", id, err)
	}

	return policy, nil
}

func (s *policyService) UpdateRule(
	ctx context.Context,
	policyID string,
	ruleID string,
	name string,
	description string,
	taskIDs []string,
	needsApproval bool,
	action policytypes.RuleAction,
) (*policytypes.Rule, error) {
	if policyID == "" {
		return nil, ErrInvalidPolicyID
	}

	if ruleID == "" {
		return nil, ErrInvalidRuleID
	}

	if name == "" {
		return nil, errutil.ValidationFailed("rule.invalidName", "Rule name cannot be empty.")
	}

	if action == policytypes.RULE_ACTION_UNSPECIFIED {
		return nil, errutil.ValidationFailed("rule.invalidAction", "Invalid rule action.")
	}

	rule, err := s.policyRepository.GetRuleByID(ctx, ruleID, policyID)
	if err != nil {
		if errors.Is(err, policycore.ErrRuleNotFound) {
			return nil, ErrRuleNotFound
		}

		return nil, fmt.Errorf("repository in UpdateRule failed to find rule %s: %w", ruleID, err)
	}

	tasks, err := s.validateTasks(ctx, taskIDs)
	if err != nil {
		return nil, err
	}

	rule.Name = name
	rule.Description = description
	rule.NeedsApproval = needsApproval
	rule.Tasks = tasks
	rule.Action = action
	rule.UpdatedAt = ptrutil.Ptr(time.Now().UTC())

	err = s.policyRepository.UpdateRule(ctx, rule)
	if err != nil {
		return nil, fmt.Errorf("repository in UpdateRule failed to update the rule %s: %w", ruleID, err)
	}

	return rule, nil
}

func (s *policyService) CountAllPolicies(ctx context.Context) (int64, error) {
	total, err := s.policyRepository.CountAllPolicies(ctx)
	if err != nil {
		return 0, fmt.Errorf("repository in CountAllPolicies failed to count policies: %w", err)
	}

	return total, nil
}

func (s *policyService) validateTasks(
	ctx context.Context,
	ids []string,
) ([]*policytypes.Task, error) {
	tasks, err := s.policyRepository.GetTasksByID(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("repository in validateTasks failed to fetch tasks %s: %w", ids, err)
	}

	for _, id := range ids {
		if !slices.ContainsFunc(tasks, func(task *policytypes.Task) bool {
			return strings.EqualFold(id, task.ID)
		}) {
			return nil, errutil.InvalidRequest("task.notFound", "Task with ID %s not found.", id)
		}
	}

	return tasks, nil
}

func (s *policyService) validateAppIDs(ctx context.Context, ids ...string) error {
	apps, err := s.appRepository.GetAppsByID(ctx, ids)
	if err != nil {
		return fmt.Errorf("repository in validateAppIDs failed to fetch apps %s: %w", ids, err)
	}

	for _, id := range ids {
		if !slices.ContainsFunc(apps, func(app *apptypes.App) bool {
			return strings.EqualFold(id, app.ID)
		}) {
			return errutil.InvalidRequest("policy.appNotFound", "Application with ID %s not found.", id)
		}
	}

	return nil
}
