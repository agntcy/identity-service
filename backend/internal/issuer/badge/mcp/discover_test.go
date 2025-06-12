// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package mcp_test

import (
	"context"
	"fmt"
	"testing"

	mcptesting "github.com/agntcy/identity-saas/internal/issuer/badge/mcp/testing"
	"github.com/stretchr/testify/assert"
)

// McpServerURL is the URL of the MCP server
// This is used for testing purposes
const McpServerHost = "127.0.0.1:8000"

func TestShouldDiscoverADeployedServer(t *testing.T) {
	t.Parallel()

	// Create a new discovery client
	discoveryClient := mcptesting.NewFakeDiscoveryClient()
	mcpServer, err := discoveryClient.Discover(
		context.Background(),
		"test-server",
		fmt.Sprintf("http://%s", McpServerHost),
	)

	t.Logf("MCP Server: %+v", mcpServer)

	assert.NoError(t, err)
}
