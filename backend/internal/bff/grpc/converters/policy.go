// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	policytypes "github.com/agntcy/identity-platform/internal/core/policy/types"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
)

func FromPolicy(src *policytypes.Policy) *identity_platform_sdk_go.Policy {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.Policy{
		Id:          ptrutil.Ptr(src.ID),
		Name:        ptrutil.Ptr(src.Name),
		Description: ptrutil.Ptr(src.Description),
		AssignedTo:  ptrutil.Ptr(src.AssignedTo),
		Rules:       convertutil.ConvertSlice(src.Rules, FromRule),
	}
}

func ToPolicy(src *identity_platform_sdk_go.Policy) *policytypes.Policy {
	if src == nil {
		return nil
	}

	return &policytypes.Policy{
		ID:          ptrutil.DerefStr(src.Id),
		Name:        ptrutil.DerefStr(src.Name),
		Description: ptrutil.DerefStr(src.Description),
		AssignedTo:  ptrutil.DerefStr(src.AssignedTo),
		Rules:       convertutil.ConvertSlice(src.Rules, ToRule),
	}
}

func FromRule(src *policytypes.Rule) *identity_platform_sdk_go.Rule {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.Rule{
		Id:            ptrutil.Ptr(src.ID),
		Name:          ptrutil.Ptr(src.Name),
		Description:   ptrutil.Ptr(src.Description),
		NeedsApproval: ptrutil.Ptr(src.NeedsApproval),
		Tasks:         convertutil.ConvertSlice(src.Tasks, FromTask),
	}
}

func ToRule(src *identity_platform_sdk_go.Rule) *policytypes.Rule {
	if src == nil {
		return nil
	}

	return &policytypes.Rule{
		ID:            ptrutil.DerefStr(src.Id),
		Name:          ptrutil.DerefStr(src.Name),
		Description:   ptrutil.DerefStr(src.Description),
		NeedsApproval: ptrutil.Derefrence(src.NeedsApproval, false),
		Tasks:         convertutil.ConvertSlice(src.Tasks, ToTask),
	}
}

func FromTask(src *policytypes.Task) *identity_platform_sdk_go.Task {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.Task{
		Id:       ptrutil.Ptr(src.ID),
		Name:     ptrutil.Ptr(src.Name),
		AppId:    ptrutil.Ptr(src.AppID),
		ToolName: ptrutil.Ptr(src.ToolName),
	}
}

func ToTask(src *identity_platform_sdk_go.Task) *policytypes.Task {
	if src == nil {
		return nil
	}

	return &policytypes.Task{
		ID:       ptrutil.DerefStr(src.Id),
		Name:     ptrutil.DerefStr(src.Name),
		AppID:    ptrutil.DerefStr(src.AppId),
		ToolName: ptrutil.DerefStr(src.ToolName),
	}
}
