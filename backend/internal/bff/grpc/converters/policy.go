// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	policytypes "github.com/agntcy/identity-service/internal/core/policy/types"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
)

func FromPolicy(src *policytypes.Policy) *identity_service_sdk_go.Policy {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.Policy{
		Id:          ptrutil.Ptr(src.ID),
		Name:        ptrutil.Ptr(src.Name),
		Description: ptrutil.Ptr(src.Description),
		AssignedTo:  ptrutil.Ptr(src.AssignedTo),
		Rules:       convertutil.ConvertSlice(src.Rules, FromRule),
		CreatedAt:   newTimestamp(&src.CreatedAt),
	}
}

func FromRule(src *policytypes.Rule) *identity_service_sdk_go.Rule {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.Rule{
		Id:            ptrutil.Ptr(src.ID),
		Name:          ptrutil.Ptr(src.Name),
		Description:   ptrutil.Ptr(src.Description),
		NeedsApproval: ptrutil.Ptr(src.NeedsApproval),
		Tasks:         convertutil.ConvertSlice(src.Tasks, FromTask),
		Action:        ptrutil.Ptr(identity_service_sdk_go.RuleAction(src.Action)),
		CreatedAt:     newTimestamp(&src.CreatedAt),
	}
}

func FromTask(src *policytypes.Task) *identity_service_sdk_go.Task {
	if src == nil {
		return nil
	}

	return &identity_service_sdk_go.Task{
		Id:       ptrutil.Ptr(src.ID),
		Name:     ptrutil.Ptr(src.Name),
		AppId:    ptrutil.Ptr(src.AppID),
		ToolName: ptrutil.Ptr(src.ToolName),
	}
}
