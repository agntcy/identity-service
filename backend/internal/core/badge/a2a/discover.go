// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package a2a

import (
	"context"
	"errors"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/outshift/identity-service/internal/pkg/httputil"
	"github.com/outshift/identity-service/pkg/log"
)

const (
	wellKnownMatcher     = `/.well-known/.*\.json$`
	wellKnownUrlSuffixV3 = "/.well-known/agent-card.json"
)

var wellKnownUrlRegex = regexp.MustCompile(wellKnownMatcher)

// The discoverClient interface defines the core methods for discovering a deployed A2A agent
type DiscoveryClient interface {
	Discover(
		ctx context.Context,
		wellKnownUrl string,
	) (string, error)
}

// The discoverClient struct implements the DiscoverClient interface
type discoveryClient struct {
}

// NewDiscoverClient creates a new instance of the DiscoverClient
func NewDiscoveryClient() DiscoveryClient {
	return &discoveryClient{}
}

func (d *discoveryClient) Discover(
	ctx context.Context,
	wellKnownUrl string,
) (string, error) {
	// Trim any trailing slashes from the well-known URL
	wellKnownUrlTrimmed := strings.TrimSuffix(wellKnownUrl, "/")

	// Check if the well-known URL ends with .json, if not, append the default V3 suffix
	if !wellKnownUrlRegex.MatchString(wellKnownUrl) {
		wellKnownUrl = wellKnownUrlTrimmed + wellKnownUrlSuffixV3
	} else {
		wellKnownUrl = wellKnownUrlTrimmed
	}

	log.Debug("Using well-known URL for agent discovery: ", wellKnownUrl)

	// get the agent card from the well-known URL
	resp, err := httputil.Get(ctx, wellKnownUrl, nil)
	if err != nil {
		return "", err
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return "", errors.New("failed to get agent card with status code: " + resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}
