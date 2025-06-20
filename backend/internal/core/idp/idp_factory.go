// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"fmt"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

func NewIdp(ctx context.Context, issuerSettings *types.IssuerSettings) (Idp, error) {
	var idp Idp

	switch issuerSettings.IdpType {
	case types.IDP_TYPE_DUO:
		idp = &DuoIdp{issuerSettings.DuoIdpSettings, nil}
	case types.IDP_TYPE_OKTA:
		idp = &OktaIdp{issuerSettings.OktaIdpSettings, nil}
	default:
		return nil, errutil.Err(
			fmt.Errorf("unknown IDP type %s", issuerSettings.IdpType),
			"unknown IDP type",
		)
	}

	err := idp.TestSettings(ctx)
	if err != nil {
		return nil, errutil.Err(err, "failed to test IDP settings")
	}

	return idp, nil
}
