// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
)

func FromApp(src *apptypes.App) *identity_platform_sdk_go.App {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.App{
		Id:          ptrutil.Ptr(src.ID),
		Name:        src.Name,
		Description: src.Description,
		Type:        ptrutil.Ptr(identity_platform_sdk_go.AppType(src.Type)),
		ApiKey:      ptrutil.Ptr(src.ApiKey),
	}
}

func ToApp(src *identity_platform_sdk_go.App) *apptypes.App {
	if src == nil {
		return nil
	}

	return &apptypes.App{
		ID:          src.GetId(),
		Name:        ptrutil.Ptr(src.GetName()),
		Description: ptrutil.Ptr(src.GetDescription()),
		Type:        apptypes.AppType(src.GetType()),
	}
}
