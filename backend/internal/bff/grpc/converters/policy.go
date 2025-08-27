// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	policytypes "github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/outshift/identity-service/internal/pkg/convertutil"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
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

func ToPolicy(src *identity_service_sdk_go.Policy) *policytypes.Policy {
	if src == nil {
		return nil
	}

	return &policytypes.Policy{
		ID:          src.GetId(),
		Name:        src.GetName(),
		Description: src.GetDescription(),
		AssignedTo:  src.GetAssignedTo(),
		Rules:       convertutil.ConvertSlice(src.Rules, ToRule),
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

func ToRule(src *identity_service_sdk_go.Rule) *policytypes.Rule {
	if src == nil {
		return nil
	}

	return &policytypes.Rule{
		ID:            src.GetId(),
		Name:          src.GetName(),
		Description:   src.GetDescription(),
		NeedsApproval: src.GetNeedsApproval(),
		Tasks:         convertutil.ConvertSlice(src.Tasks, ToTask),
		Action:        policytypes.RuleAction(src.GetAction()),
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

func ToTask(src *identity_service_sdk_go.Task) *policytypes.Task {
	if src == nil {
		return nil
	}

	return &policytypes.Task{
		ID:       src.GetId(),
		Name:     src.GetName(),
		AppID:    src.GetAppId(),
		ToolName: src.GetToolName(),
	}
}
