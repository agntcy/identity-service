// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package mcp_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	mcpcore "github.com/agntcy/identity-service/internal/core/badge/mcp"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/stretchr/testify/assert"
)

type contextKey string

const (
	testHeaderKey     contextKey = "X-Test-Header"
	testHeaderFuncKey contextKey = "X-Test-Header-Func"
)

func TestDiscover(t *testing.T) {
	t.Parallel()

	// Create MCP server with capabilities
	mcpServer := server.NewMCPServer(
		"test-server",
		"1.0.0",
		server.WithResourceCapabilities(true, true),
		server.WithPromptCapabilities(true),
		server.WithToolCapabilities(true),
	)

	mcpServer.AddTool(mcp.NewTool(
		"tool1",
		mcp.WithDescription("tool 1 description"),
		mcp.WithString("parameter-1", mcp.Description("A string tool parameter")),
	), nil)
	mcpServer.AddTool(mcp.NewTool("tool2", mcp.WithDescription("tool 2 description")), nil)
	mcpServer.AddResource(mcp.NewResource("uri", "name"), nil)

	testCases := map[string]*struct {
		testServer *httptest.Server
		path       string
		clientType string
	}{
		"should return tools for SSE client": {
			testServer: server.NewTestServer(mcpServer,
				server.WithSSEContextFunc(func(ctx context.Context, r *http.Request) context.Context {
					ctx = context.WithValue(ctx, testHeaderKey, r.Header.Get("X-Test-Header"))
					ctx = context.WithValue(ctx, testHeaderFuncKey, r.Header.Get("X-Test-Header-Func"))
					return ctx
				}),
			),
			path:       "/sse",
			clientType: mcpcore.McpClientTypeSSE,
		},
		"should return tools for streamable HTTP client": {
			testServer: server.NewTestStreamableHTTPServer(mcpServer),
			path:       "",
			clientType: mcpcore.McpClientTypeStreamableHTTP,
		},
	}

	for tn, tc := range testCases {
		t.Run(
			tn,
			func(t *testing.T) {
				t.Parallel()

				defer tc.testServer.Close()

				sut := mcpcore.NewDiscoveryClient()

				ret, err := sut.Discover(context.Background(), "mcp_server", tc.testServer.URL+tc.path, tc.clientType)

				assert.NoError(t, err)
				assert.NotNil(t, ret)
				assert.Equal(t, "mcp_server", ret.Name)
				assert.Len(t, ret.Tools, 2)
				assert.Equal(t, "tool1", ret.Tools[0].Name)
				assert.Equal(t, "tool 1 description", ret.Tools[0].Description)
				assert.Len(t, ret.Tools[0].Parameters["properties"], 1)
				assert.Equal(t, "tool2", ret.Tools[1].Name)
				assert.Equal(t, "tool 2 description", ret.Tools[1].Description)
				assert.Empty(t, ret.Tools[1].Parameters["properties"])
				assert.Len(t, ret.Resources, 1)
				assert.Equal(t, "name", ret.Resources[0].Name)
				assert.Equal(t, "uri", ret.Resources[0].URI)
			},
		)
	}
}
