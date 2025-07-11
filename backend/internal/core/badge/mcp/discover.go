// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package mcp

import (
	"context"
	"encoding/json"
	urllib "net/url"
	"strings"

	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/log"
	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

const (
	mcpSuffix                   = "/mcp"
	sseSuffix                   = "/sse"
	McpClientTypeSSE            = "sse"
	McpClientTypeStreamableHTTP = "streamable-http"
)

// The discoverClient interface defines the core methods for
// discovering a deployed MCP server
type DiscoveryClient interface {
	AutoDiscover(ctx context.Context, name, url string) (*McpServer, error)
	Discover(ctx context.Context, name, url, clientType string) (*McpServer, error)
}

// The discoverClient struct implements the DiscoverClient interface
type discoveryClient struct {
}

// NewDiscoverClient creates a new instance of the DiscoverClient
func NewDiscoveryClient() DiscoveryClient {
	return &discoveryClient{}
}

func (d *discoveryClient) AutoDiscover(
	ctx context.Context,
	name, url string,
) (*McpServer, error) {
	var mcpServer *McpServer
	var err error

	log.Debug("Auto-discovering MCP server at URL: ", url)
	log.Debug("Using name for MCP server: ", name)

	// Attempt to discover the MCP server using the streamable HTTP client first
	mcpServer, err = d.Discover(ctx, name, url, McpClientTypeStreamableHTTP)
	if err != nil {
		// If that fails, try the SSE client
		mcpServer, err = d.Discover(ctx, name, url, McpClientTypeSSE)
	}

	return mcpServer, err
}

func (d *discoveryClient) Discover(
	ctx context.Context,
	name, url string,
	clientType string,
) (*McpServer, error) {
	// Trim the last path "/" from the URL if it exists
	url = strings.TrimSuffix(url, "/")

	log.Debug("Using MCP URL for discovery: ", url)

	var mcpClient *client.Client
	var err error

	switch clientType {
	case McpClientTypeStreamableHTTP:
		log.Debug("Using streamable HTTP client for MCP discovery")

		url = strings.TrimSuffix(url, mcpSuffix)
		mcpClient, err = client.NewStreamableHttpClient(
			url + mcpSuffix,
		)
	case McpClientTypeSSE:
		log.Debug("Using SSE client for MCP discovery")

		url = strings.TrimSuffix(url, sseSuffix)
		mcpClient, err = client.NewSSEMCPClient(url + sseSuffix)
	}

	if err != nil || mcpClient == nil {
		return nil, errutil.Err(
			err,
			"failed to create mcp client",
		)
	}

	if clientType == McpClientTypeSSE {
		// Start the SSE client
		err = mcpClient.Start(ctx)
		if err != nil {
			return nil, errutil.Err(
				err,
				"failed to start mcp client",
			)
		}
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
			"failed to discover mcp tools",
		)
	}

	// After that the resources
	resourcesRequest := mcp.ListResourcesRequest{}

	resourcesList, err := mcpClient.ListResources(ctx, resourcesRequest)
	if err != nil {
		log.Warn("Failed to discover MCP resources, continuing without them: ", err)
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

	if resourcesList != nil && len(resourcesList.Resources) > 0 {
		for index := range resourcesList.Resources {
			resource := resourcesList.Resources[index]

			availableResources = append(availableResources, &McpResource{
				Name:        resource.Name,
				Description: resource.Description,
				URI:         resource.URI,
			})
		}
	}

	urlObj, err := urllib.Parse(url)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to parse MCP URL",
		)
	}

	safeUrl, err := urllib.JoinPath(urlObj.Scheme, urlObj.Host)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to join MCP URL",
		)
	}

	return &McpServer{
		Name:      name,
		URL:       safeUrl,
		Tools:     availableTools,
		Resources: availableResources,
	}, nil
}
