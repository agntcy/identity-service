// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Authentifier: Apache-2.0

package policy

import (
	"context"
	"fmt"

	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	"github.com/agntcy/identity-service/internal/core/policy/types"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/pkg/log"
)

type Evaluator interface {
	Evaluate(
		ctx context.Context,
		calledApp *apptypes.App,
		callingAppID string,
		toolName string,
	) (*types.Rule, error)
}

type evaluator struct {
	policyRepository PolicyRepository
}

func NewEvaluator(policyRepository PolicyRepository) Evaluator {
	return &evaluator{
		policyRepository: policyRepository,
	}
}

func (e *evaluator) Evaluate(
	ctx context.Context,
	calledApp *apptypes.App,
	callingAppID string,
	toolName string,
) (*types.Rule, error) {
	if calledApp.Type == apptypes.APP_TYPE_MCP_SERVER && toolName == "" {
		return nil, errutil.ValidationFailed("auth.emptyToolName", "Please provide a tool name.")
	}

	log.FromContext(ctx).Debug("Evaluating policies for app: ", calledApp.ID,
		", calling app ID: ", callingAppID, ", tool name: ", toolName)

	policies, err := e.policyRepository.GetByAppID(ctx, callingAppID)
	if err != nil {
		return nil, fmt.Errorf("repository failed to fetch policies for app %s: %w", callingAppID, err)
	}

	for _, policy := range policies {
		rule := policy.CanInvoke(calledApp.ID, toolName)
		if rule != nil {
			return rule, nil
		}
	}

	return nil, errutil.Unauthorized("auth.unauthorized", "The application is unauthorized to make a call.")
}
