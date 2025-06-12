// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package mcp

import (
	"context"
	"encoding/json"
	"fmt"

	mcptypes "github.com/agntcy/identity-saas/internal/issuer/badge/mcp/types"
	"github.com/agntcy/identity-saas/internal/pkg/errutil"
	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

// The discoverClient interface defines the core methods for
// discovering a deployed MCP server
type DiscoveryClient interface {
	Discover(ctx context.Context, name, url string) (*mcptypes.McpServer, error)
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
	name, url string,
) (*mcptypes.McpServer, error) {
	// Create streameable http client
	// We only support streamable http client for now
	mcpClient, err := client.NewStreamableHttpClient(fmt.Sprintf("%s/mcp", url))
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to create mcp client",
		)
	}

	// Initialize the client
	_, err = mcpClient.Initialize(ctx, mcp.InitializeRequest{})
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to initialize mcp client",
		)
	}

	defer mcpClient.Close()

	// Discover MCP server
	// First the tools
	toolsRequest := mcp.ListToolsRequest{}

	toolsList, err := mcpClient.ListTools(ctx, toolsRequest)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to discover mcp server",
		)
	}

	// After that the resources
	resourcesRequest := mcp.ListResourcesRequest{}

	resourcesList, err := mcpClient.ListResources(ctx, resourcesRequest)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to discover mcp server",
		)
	}

	// Parse the tools and resources
	// Get the first batch of tools
	availableTools := make([]*mcptypes.McpTool, 0)

	for index := range toolsList.Tools {
		tool := toolsList.Tools[index]

		// Convert parameters to JSON string
		jsonParams, err := json.Marshal(tool.InputSchema)
		if err != nil {
			jsonParams = []byte{}
		}

		availableTools = append(availableTools, &mcptypes.McpTool{
			Name:        tool.Name,
			Description: tool.Description,
			Parameters:  string(jsonParams),
		})
	}

	// Get the first batch of resources
	availableResources := make([]*mcptypes.McpResource, 0)

	for index := range resourcesList.Resources {
		resource := resourcesList.Resources[index]

		availableResources = append(availableResources, &mcptypes.McpResource{
			Name:        resource.Name,
			Description: resource.Description,
			URI:         resource.URI,
		})
	}

	return &mcptypes.McpServer{
		Name:      name,
		URL:       url,
		Tools:     availableTools,
		Resources: availableResources,
	}, nil
}
