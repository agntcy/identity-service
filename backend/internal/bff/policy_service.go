// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package bff

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	policycore "github.com/agntcy/identity-platform/internal/core/policy"
	policytypes "github.com/agntcy/identity-platform/internal/core/policy/types"
	"github.com/google/uuid"
)

type PolicyService interface {
	CreatePolicy(ctx context.Context, policy *policytypes.Policy) (*policytypes.Policy, error)
	CreateRule(ctx context.Context, rule *policytypes.Rule) (*policytypes.Rule, error)
}

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
	policy *policytypes.Policy,
) (*policytypes.Policy, error) {
	if policy == nil {
		return nil, errors.New("request cannot be empty")
	}

	policy.ID = uuid.NewString()

	err := s.validatePolicy(ctx, policy)
	if err != nil {
		return nil, err
	}

	for _, rule := range policy.Rules {
		rule.ID = uuid.NewString()

		for _, task := range rule.Tasks {
			task.ID = uuid.NewString()
		}
	}

	err = s.policyRepository.Create(ctx, policy)
	if err != nil {
		return nil, err
	}

	return policy, nil
}

func (s *policyService) CreateRule(
	ctx context.Context,
	rule *policytypes.Rule,
) (*policytypes.Rule, error) {
	if rule == nil {
		return nil, errors.New("rule cannot be empty")
	}

	rule.ID = uuid.NewString()

	err := s.validateRules(ctx, []*policytypes.Rule{rule})
	if err != nil {
		return nil, err
	}

	for _, task := range rule.Tasks {
		task.ID = uuid.NewString()
	}

	err = s.policyRepository.CreateRule(ctx, rule)
	if err != nil {
		return nil, err
	}

	return rule, nil
}

func (s *policyService) validatePolicy(ctx context.Context, policy *policytypes.Policy) error {
	err := s.validateAppIDs(ctx, policy.AssignedTo)
	if err != nil {
		return fmt.Errorf("policy is linked to an invalid app %s", policy.AssignedTo)
	}

	return s.validateRules(ctx, policy.Rules)
}

func (s *policyService) validateRules(ctx context.Context, rules []*policytypes.Rule) error {
	for _, rule := range rules {
		err := s.validateTasks(ctx, rule.Tasks)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *policyService) validateTasks(ctx context.Context, tasks []*policytypes.Task) error {
	appIDs := make([]string, len(tasks))
	for idx, task := range tasks {
		appIDs[idx] = task.AppID
	}

	err := s.validateAppIDs(ctx, appIDs...)
	if err != nil {
		return fmt.Errorf("invalid tasks: %w", err)
	}

	return nil
}

func (s *policyService) validateAppIDs(ctx context.Context, ids ...string) error {
	apps, err := s.appRepository.GetApps(ctx, ids)
	if err != nil {
		return fmt.Errorf("unable to validate the applications: %w", err)
	}

	for _, id := range ids {
		if !slices.ContainsFunc(apps, func(app *apptypes.App) bool {
			return strings.EqualFold(id, app.ID)
		}) {
			return fmt.Errorf("app with id %s does not exist", id)
		}
	}

	return nil
}
