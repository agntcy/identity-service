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
	CreatePolicy(
		ctx context.Context,
		name string,
		description string,
		assignedTo string,
	) (*policytypes.Policy, error)
	CreateRule(
		ctx context.Context,
		name string,
		description string,
		taskIDs []string,
		needsApproval bool,
	) (*policytypes.Rule, error)
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
	name string,
	description string,
	assignedTo string,
) (*policytypes.Policy, error) {
	if name == "" {
		return nil, errors.New("name cannot be empty")
	}

	err := s.validateAppIDs(ctx, assignedTo)
	if err != nil {
		return nil, fmt.Errorf("policy is linked to an invalid app %s", assignedTo)
	}

	policy := &policytypes.Policy{
		ID:          uuid.NewString(),
		Name:        name,
		Description: description,
	}

	err = s.policyRepository.Create(ctx, policy)
	if err != nil {
		return nil, err
	}

	return policy, nil
}

func (s *policyService) CreateRule(
	ctx context.Context,
	name string,
	description string,
	taskIDs []string,
	needsApproval bool,
) (*policytypes.Rule, error) {
	if name == "" {
		return nil, errors.New("name cannot be empty")
	}

	tasks, err := s.validateTasks(ctx, taskIDs)
	if err != nil {
		return nil, err
	}

	rule := &policytypes.Rule{
		ID:            uuid.NewString(),
		Name:          name,
		Description:   description,
		Tasks:         tasks,
		NeedsApproval: needsApproval,
	}

	err = s.policyRepository.CreateRule(ctx, rule)
	if err != nil {
		return nil, err
	}

	return rule, nil
}

func (s *policyService) validateTasks(ctx context.Context, ids []string) ([]*policytypes.Task, error) {
	tasks, err := s.policyRepository.GetTasksByID(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("unable to valiate tasks")
	}

	for _, id := range ids {
		if slices.ContainsFunc(tasks, func(task *policytypes.Task) bool {
			return strings.EqualFold(id, task.ID)
		}) {
			return nil, fmt.Errorf("invalid task %s", id)
		}
	}

	return tasks, nil
}

func (s *policyService) validateAppIDs(ctx context.Context, ids ...string) error {
	apps, err := s.appRepository.GetAppsByID(ctx, ids)
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
