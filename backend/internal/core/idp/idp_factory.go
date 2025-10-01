// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"fmt"

	"github.com/agntcy/identity-service/internal/core/settings/types"
)

type IdpFactory interface {
	Create(ctx context.Context, issuerSettings *types.IssuerSettings) (Idp, error)
}

type idpFactory struct{}

func NewFactory() IdpFactory {
	return &idpFactory{}
}

func (f *idpFactory) Create(
	ctx context.Context,
	issuerSettings *types.IssuerSettings,
) (Idp, error) {
	var idp Idp

	switch issuerSettings.IdpType {
	case types.IDP_TYPE_DUO:
		idp = NewDuoIdp(issuerSettings.DuoIdpSettings)
	case types.IDP_TYPE_OKTA:
		idp = NewOktaIdp(issuerSettings.OktaIdpSettings)
	case types.IDP_TYPE_ORY:
		idp = NewOryIdp(issuerSettings.OryIdpSettings)
	case types.IDP_TYPE_SELF:
		idp = NewSelfIdp()
	default:
		return nil, fmt.Errorf("unknown IDP type %s", issuerSettings.IdpType)
	}

	err := idp.TestSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to test IDP settings: %w", err)
	}

	return idp, nil
}
