// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	settingstypes "github.com/agntcy/identity-platform/internal/core/settings/types"
)

func FromSettings(src *settingstypes.Settings) *identity_platform_sdk_go.Settings {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.Settings{}
}

func ToSettings(src *identity_platform_sdk_go.Settings) *settingstypes.Settings {
	if src == nil {
		return nil
	}

	return &settingstypes.Settings{}
}
