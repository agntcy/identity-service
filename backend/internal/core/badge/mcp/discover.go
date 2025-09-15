// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	urllib "net/url"
	"strings"
	"time"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/pkg/log"
)

const (
	mcpToolsDiscoveryTimeout     = 30 * time.Second
	mcpResourcesDiscoveryTimeout = 2 * time.Second
	mcpSuffix                    = "/mcp"
	sseSuffix                    = "/sse"
	McpClientTypeSSE             = "sse"
	McpClientTypeStreamableHTTP  = "streamable-http"
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
	var (
		mcpServer *McpServer
		err       error
	)

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

	// Create an MCP client
	mcpClient, err := d.createClient(url, clientType)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to create mcp client",
		)
	}

	// Initialize the client
	err = d.initializeClient(ctx, mcpClient, clientType)
	if err != nil {
		return nil, err
	}

	defer func() {
		_ = mcpClient.Close()
	}()

	// Give it a timeout to discover tools
	tCtx, tCancel := context.WithTimeout(ctx, mcpToolsDiscoveryTimeout)
	defer tCancel()

	// Discover MCP server
	// First the tools
	toolsList, err := mcpClient.ListTools(tCtx, mcp.ListToolsRequest{})
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to discover mcp tools",
		)
	}

	log.Debug("Discovered ", len(toolsList.Tools), " tools from MCP server")

	// Give it a timeout to discover resources
	rCtx, rCancel := context.WithTimeout(ctx, mcpResourcesDiscoveryTimeout)
	defer rCancel()

	// After that the resources
	resourcesList, err := mcpClient.ListResources(rCtx, mcp.ListResourcesRequest{})
	if err != nil {
		log.Warn("Failed to discover MCP resources, continuing without them: ", err)
	}

	log.Debug("Parsing discovered MCP tools and resources")

	// Parse the tools and resources
	// Get the first batch of tools
	availableTools := make([]*McpTool, 0)

	for index := range toolsList.Tools {
		tool, err := d.parseTool(&toolsList.Tools[index])
		if err != nil {
			return nil, err
		}

		availableTools = append(availableTools, tool)
	}

	log.Debug("Discovered ", len(availableTools), " tools from MCP server")

	// Get the first batch of resources
	availableResources := make([]*McpResource, 0)

	if resourcesList != nil && len(resourcesList.Resources) > 0 {
		for index := range resourcesList.Resources {
			resource := d.parseResource(&resourcesList.Resources[index])
			availableResources = append(availableResources, resource)
		}
	}

	log.Debug("Discovered ", len(availableResources), " resources from MCP server")

	safeUrl, err := d.extractSafeURL(url)
	if err != nil {
		return nil, err
	}

	return &McpServer{
		Name:      name,
		URL:       safeUrl,
		Tools:     availableTools,
		Resources: availableResources,
	}, nil
}

func (d *discoveryClient) createClient(url, clientType string) (*client.Client, error) {
	switch clientType {
	case McpClientTypeStreamableHTTP:
		log.Debug("Using streamable HTTP client for MCP discovery")

		url = strings.TrimSuffix(url, mcpSuffix)

		return client.NewStreamableHttpClient(
			url + mcpSuffix,
		)
	case McpClientTypeSSE:
		log.Debug("Using SSE client for MCP discovery")

		url = strings.TrimSuffix(url, sseSuffix)

		return client.NewSSEMCPClient(url + sseSuffix)
	default:
		return nil, fmt.Errorf("unknown MCP client type %s", clientType)
	}
}

func (d *discoveryClient) initializeClient(ctx context.Context, mcpClient *client.Client, clientType string) error {
	if clientType == McpClientTypeSSE {
		// Start the SSE client
		err := mcpClient.Start(ctx)
		if err != nil {
			return errutil.Err(
				err,
				"failed to start mcp client",
			)
		}
	}

	// Initialize the client
	_, err := mcpClient.Initialize(ctx, mcp.InitializeRequest{})
	if err != nil {
		return errutil.Err(
			err,
			"failed to initialize mcp client",
		)
	}

	return nil
}

func (d *discoveryClient) parseTool(tool *mcp.Tool) (*McpTool, error) {
	log.Debug("Processing tool: ", tool.Name)

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

	return &McpTool{
		Name:        tool.Name,
		Description: tool.Description,
		Parameters:  parameters,
	}, nil
}

func (d *discoveryClient) parseResource(resource *mcp.Resource) *McpResource {
	return &McpResource{
		Name:        resource.Name,
		Description: resource.Description,
		URI:         resource.URI,
	}
}

func (d *discoveryClient) extractSafeURL(url string) (string, error) {
	urlObj, err := urllib.Parse(url)
	if err != nil {
		return "", errutil.Err(
			err,
			"failed to parse MCP URL",
		)
	}

	safeUrl, err := urllib.JoinPath(urlObj.Scheme, urlObj.Host)
	if err != nil {
		return "", errutil.Err(
			err,
			"failed to join MCP URL",
		)
	}

	return safeUrl, nil
}
