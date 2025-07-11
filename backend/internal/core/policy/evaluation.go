// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package policy

import (
	"context"
	"errors"

	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity/pkg/log"
)

type Evaluator interface {
	Evaluate(
		ctx context.Context,
		calledApp *apptypes.App,
		callingAppID string,
		toolName string,
	) error
}

type evaluator struct {
	policyRepository Repository
}

func NewEvaluator(policyRepository Repository) Evaluator {
	return &evaluator{
		policyRepository: policyRepository,
	}
}

func (e *evaluator) Evaluate(
	ctx context.Context,
	calledApp *apptypes.App,
	callingAppID string,
	toolName string,
) error {
	if calledApp.Type == apptypes.APP_TYPE_MCP_SERVER && toolName == "" {
		return errors.New("please provide a tool name")
	}

	log.Debug("Evaluating policies for app: ", calledApp.ID,
		", calling app ID: ", callingAppID, ", tool name: ", toolName)

	policies, err := e.policyRepository.GetPoliciesByAppID(ctx, callingAppID)
	if err != nil {
		return err
	}

	for _, policy := range policies {
		if policy.CanInvoke(calledApp.ID, toolName) {
			return nil
		}
	}

	return errors.New("not allowed")
}
