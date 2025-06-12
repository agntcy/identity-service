// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package oidc

import (
	"context"
	"net/http"
	"strings"

	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/httputil"
	"github.com/agntcy/identity-platform/pkg/log"
)

func (p *parser) detectProviderName(
	ctx context.Context,
	provider *providerMetadata,
) (ProviderName, error) {
	resp, err := httputil.Get(ctx, provider.JWKSURL, nil)
	if err != nil {
		return UnknownProviderName, err
	}

	resp.Body.Close()

	if isOkta(resp) {
		return OktaProviderName, nil
	} else if isDuo(resp) {
		return DuoProviderName, nil
	}

	return UnknownProviderName, errutil.Err(nil, "unable to detect provider name")
}

func isOkta(resp *http.Response) bool {
	return resp != nil && resp.Header.Get("X-Okta-Request-Id") != ""
}

func isDuo(resp *http.Response) bool {
	return resp != nil &&
		(strings.HasPrefix(strings.ToLower(resp.Header.Get("Server")), "duo") ||
			strings.HasPrefix(resp.Request.Host, "duosecurity.com"))
}

func getProviderMetadata(ctx context.Context, issuer string) (*providerMetadata, error) {
	// Get the raw data from the issuer
	var metadata providerMetadata

	// Get the well-known URL from the issuer
	wellKnownURL := getWellKnownURL(issuer)
	log.Debug("Getting metadata from issuer:", issuer, " with URL:", wellKnownURL)

	// Get the metadata from the issuer
	err := httputil.GetJSON(ctx, wellKnownURL, &metadata)
	if err != nil {
		return nil, errutil.Err(err, "failed to get metadata from issuer")
	}

	log.Debug("Got metadata from issuer:", metadata)

	return &metadata, nil
}

func getWellKnownURL(issuer string) string {
	return issuer + "/.well-known/openid-configuration"
}
