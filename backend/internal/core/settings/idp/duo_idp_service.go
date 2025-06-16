// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	duosdk "github.com/duosecurity/duo_api_golang"
)

type DuoIdp struct {
	IdpSettings *types.DuoIdpSettings
}

func (d *DuoIdp) TestSettings(ctx context.Context) error {
	if d.IdpSettings == nil {
		return errutil.Err(
			nil,
			"duo idp settings are not configured",
		)
	}

	duoapi := duosdk.NewDuoApi(
		d.IdpSettings.SecretKey,
		d.IdpSettings.IntegrationKey,
		d.IdpSettings.Hostname,
		"")

	_, _, err := duoapi.SignedCall("GET", "/admin/v3/integrations", nil, nil)

	return errutil.Err(
		err,
		"failed to test Duo IdP settings",
	)
}

func (d *DuoIdp) CreateClientCredentialsPair(ctx context.Context) error {
	// Implement the logic to create a client credentials pair in Duo IdP.
	// This could involve making a request to the Duo API to create the credentials.
	return nil
}
