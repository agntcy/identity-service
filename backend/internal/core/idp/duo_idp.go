// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"net/http"
	"time"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/log"
	duosdk "github.com/duosecurity/duo_api_golang"
)

const (
	duoTimeout    = 10 // seconds
	duoClientName = "duo-client"
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
		d.IdpSettings.IntegrationKey,
		d.IdpSettings.SecretKey,
		d.IdpSettings.Hostname,
		duoClientName,
		duosdk.SetTimeout(duoTimeout*time.Second))

	response, _, err := duoapi.JSONSignedCall(
		"GET",
		"/admin/v3/integrations",
		nil,
		duosdk.UseTimeout,
	)

	log.Debug("Got response from Duo IdP: ", response.StatusCode)

	if err != nil || response.StatusCode != http.StatusOK {
		return errutil.Err(
			err,
			"failed to test Duo IdP settings",
		)
	}

	return nil
}

func (d *DuoIdp) CreateClientCredentialsPair(ctx context.Context) error {
	// Implement the logic to create a client credentials pair in Duo IdP.
	// This could involve making a request to the Duo API to create the credentials.
	return nil
}
