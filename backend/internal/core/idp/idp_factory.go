// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"fmt"

	"github.com/outshift/identity-service/internal/core/settings/types"
	"github.com/outshift/identity-service/internal/pkg/errutil"
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
