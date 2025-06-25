// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
)

func FromToken(src *authtypes.Token) *identity_platform_sdk_go.Token {
	if src == nil {
		return nil
	}

	return &identity_platform_sdk_go.Token{
		Id:    ptrutil.Ptr(src.ID),
		Value: ptrutil.Ptr(src.Value),
	}
}
