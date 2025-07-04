// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package a2a

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/agntcy/identity-platform/internal/pkg/httputil"
	"github.com/agntcy/identity-platform/pkg/log"
)

const wellKnownUrlSuffix = "/.well-known/agent.json"

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
	// validate the well-known URL
	if !strings.HasSuffix(wellKnownUrl, wellKnownUrlSuffix) {
		wellKnownUrl = strings.TrimSuffix(wellKnownUrl, "/") + wellKnownUrlSuffix
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
