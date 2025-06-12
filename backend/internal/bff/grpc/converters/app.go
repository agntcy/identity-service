// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	platform_sdk_go "github.com/agntcy/identity/platform/api/server/agntcy/identity/platform/v1alpha1"
)

func FromApp(src *apptypes.App) *platform_sdk_go.App {
	if src == nil {
		return nil
	}

	return &platform_sdk_go.App{
		ID:          ptrutil.Ptr(src.ID),
		Name:        ptrutil.Ptr(src.Name),
		Description: ptrutil.Ptr(src.Description),
		Type:        platform_sdk_go.AppType(src.Type),
	}
}

func ToApp(src *platform_sdk_go.App) *apptypes.App {
	if src == nil {
		return nil
	}

	return &apptypes.App{
		ID:          src.GetID(),
		Name:        src.GetName(),
		Description: src.GetDescription(),
		Type:        apptypes.AppType(src.GetType()),
	}
}
