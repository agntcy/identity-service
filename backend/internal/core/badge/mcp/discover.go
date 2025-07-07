// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package mcp

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

const mcpSuffix = "/mcp"

// The discoverClient interface defines the core methods for
// discovering a deployed MCP server
type DiscoveryClient interface {
	Discover(ctx context.Context, name, url string) (*McpServer, error)
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
) (*McpServer, error) {
	// Check if the URL already has the mcp path
	if !strings.HasSuffix(url, mcpSuffix) {
		url = strings.TrimSuffix(url, "/") + mcpSuffix
	}

	// Create streameable http client
	// We only support streamable http client for now
	mcpClient, err := client.NewStreamableHttpClient(url)
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

	defer func() {
		_ = mcpClient.Close()
	}()

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
	availableTools := make([]*McpTool, 0)

	for index := range toolsList.Tools {
		tool := toolsList.Tools[index]

		// Convert parameters to JSON string
		jsonParams, err := json.Marshal(tool.InputSchema)
		if err != nil {
			jsonParams = []byte{}
		}

		var parameters map[string]any

		err = json.Unmarshal(jsonParams, &parameters)
		if err != nil {
			return nil, errutil.Err(
				err,
				"failed to parse MCP tools",
			)
		}

		availableTools = append(availableTools, &McpTool{
			Name:        tool.Name,
			Description: tool.Description,
			Parameters:  parameters,
		})
	}

	// Get the first batch of resources
	availableResources := make([]*McpResource, 0)

	for index := range resourcesList.Resources {
		resource := resourcesList.Resources[index]

		availableResources = append(availableResources, &McpResource{
			Name:        resource.Name,
			Description: resource.Description,
			URI:         resource.URI,
		})
	}

	return &McpServer{
		Name:      name,
		URL:       url,
		Tools:     availableTools,
		Resources: availableResources,
	}, nil
}
