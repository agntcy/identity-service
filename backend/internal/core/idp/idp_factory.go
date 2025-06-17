// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"fmt"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

func NewIdp(issuerSettings *types.IssuerSettings) (Idp, error) {
	switch issuerSettings.IdpType {
	case types.IDP_TYPE_DUO:
		return &DuoIdp{issuerSettings.DuoIdpSettings}, nil
	case types.IDP_TYPE_OKTA:
		return nil, errutil.Err(
			fmt.Errorf("IDP type %s is not supported yet", issuerSettings.IdpType),
			"unsupported IDP type",
		)
	default:
		return nil, errutil.Err(
			fmt.Errorf("unknown IDP type %s", issuerSettings.IdpType),
			"unknown IDP type",
		)
	}
}
