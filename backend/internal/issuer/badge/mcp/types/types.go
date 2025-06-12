// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// McpServer represents an MCP server that provides a set of tools and resources
// The server needs to be deployed at a specific URL
type McpServer struct {
	// Name of the server.
	Name string `json:"name"`

	// Url of the deployed server.
	URL string `json:"url"`

	// The tools available on the server.
	Tools []*McpTool `json:"tools,omitempty"`

	// The resources available on the server.
	Resources []*McpResource `json:"resources,omitempty"`
}

// McpTool represents a tool available on the MCP server.
// This can be a function with name, description, and parameters.
type McpTool struct {
	// Name of the tool.
	Name string `json:"name"`

	// Description of the tool.
	Description string `json:"description"`

	// Parameters of the tool.
	// This is a JSON object that describes the parameters
	Parameters string `json:"parameters,omitempty"`

	// Oauth2 Protected Resource metadata.
	// This will correspond to a resource on the server.
	// Or can be specified or overridden by the auth policies.
	// This complies with RFC 9728.
	Oauth2Metadata *Oauth2Metadata `json:"oauth2_metadata,omitempty"`
}

// McpResource represents a resource available on the MCP server.
// This can be a file, a database, or any other type of resource.
type McpResource struct {
	// Name of the resource.
	Name string `json:"name"`

	// Description of the resource.
	Description string `json:"description"`

	// URI of the resource.
	URI string `json:"uri"`
}

// Oauth2Metadata represents the OAuth2 metadata for a protected resource.
// This complies with RFC 9728.
type Oauth2Metadata struct {
	// The resource identifier.
	Resource string `json:"resource"`

	// Authorization servers for the OAuth2 server.
	// This is a list of strings, such as "https://example.com/oauth2/authorize".
	AuthorizationServers *string `json:"authorization_servers"`

	// Bearer methods supported
	// This is a list of strings, such as "client_credentials" or "authorization_code".
	BearerMethodsSupported []string `json:"bearer_methods_supported"`

	// Scopes supported
	// This is a list of strings, such as "openid" or "profile".
	ScopesSupported []string `json:"scopes_supported"`
}
