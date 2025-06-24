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
	policytypes "github.com/agntcy/identity-platform/internal/core/policy/types"
	"github.com/google/uuid"
)

type PolicyService interface {
	CreatePolicy(ctx context.Context, policy *policytypes.Policy) (*policytypes.Policy, error)
}

type policyService struct {
	appRepository appcore.Repository
}

func NewPolicyService(appRepository appcore.Repository) PolicyService {
	return &policyService{
		appRepository: appRepository,
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

	s.validateRules(ctx, policy.Rules)

	for _, rule := range policy.Rules {
		rule.ID = uuid.NewString()

		for _, task := range rule.Tasks {
			task.ID = uuid.NewString()
		}
	}

}

func (s *policyService) validateRules(ctx context.Context, rules []*policytypes.Rule) error {
	appIDs := make([]string, len(rules))
	for _, rule := range rules {
		appIDs = append(appIDs, rule.AssignedTo)

		err := s.validateTasks(ctx, rule.Tasks)
		if err != nil {
			return err
		}
	}

	err := s.validateAppIDs(ctx, appIDs)
	if err != nil {
		return fmt.Errorf("invalid rules: %w")
	}

	return nil
}

func (s *policyService) validateTasks(ctx context.Context, tasks []*policytypes.Task) error {
	appIDs := make([]string, len(tasks))
	for _, task := range tasks {
		appIDs = append(appIDs, task.AppID)
	}

	err := s.validateAppIDs(ctx, appIDs)
	if err != nil {
		return fmt.Errorf("invalid tasks: %w", err)
	}

	return nil
}

func (s *policyService) validateAppIDs(ctx context.Context, ids []string) error {
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
