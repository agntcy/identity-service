// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"context"

	"github.com/agntcy/identity-saas/internal/issuer/badge/mcp"
	mcptypes "github.com/agntcy/identity-saas/internal/issuer/badge/mcp/types"
)

type FakeDiscoveryClient struct {
}

func NewFakeDiscoveryClient() mcp.DiscoveryClient {
	return &FakeDiscoveryClient{}
}

func (d *FakeDiscoveryClient) Discover(
	_ context.Context,
	_, _ string,
) (*mcptypes.McpServer, error) {
	return &mcptypes.McpServer{}, nil
}
