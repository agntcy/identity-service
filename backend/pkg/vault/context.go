// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package vault

import (
	"fmt"

	vault "github.com/hashicorp/vault/api"
)

type Context interface {
	Client() *vault.Client
	Init() error
	WriteSecret(ctx context.Context, path, key string, value map[string]interface{}) error
	ReadSecret(ctx context.Context, path, key string) (map[string]interface{}, error)
}

type context struct {
	host   string
	port   string
	client *vault.Client
}

func NewContext(host, port, goEnv string) Context {
	return &context{
		host:  host,
		port:  port,
		goEnv: goEnv,
	}
}

// Initialize the Vault client
func (d *context) Init() error {
	// Check GO environment
	if d.goEnv == "production" {
		// Add a different auth type using SSL
		return fmt.Errorf("production environment not supported yet")
	}

	// Create config
	config := vault.DefaultConfig()
	config.Address = fmt.Sprintf("http://%s:%s", d.host, d.port)

	// Create Vault client
	client, err := vault.NewClient(config)
	if err != nil {
		return fmt.Errorf("failed to create Vault client: %w", err)
	}

	// Authenticate in dev mode using the root token
	// This must be set in the environment variable VAULT_DEV_ROOT_TOKEN
	client.SetToken(env.Get("VAULT_DEV_ROOT_TOKEN"))

	d.client = client

	return nil
}

func (d *context) WriteSecret(
	ctx context.Context,
	path, key string,
	value map[string]interface{},
) error {
	_, err := d.client.KVv2(path).Put(ctx, key, value)
	if err != nil {
		return fmt.Errorf("failed to write secret to path %s: %w", path, err)
	}

	return nil
}

func (d *context) ReadSecret(
	ctx context.Context,
	path, key string,
) (map[string]interface{}, error) {
	secret, err := d.client.KVv2(path).Get(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("failed to read secret from path %s: %w", path, err)
	}

	if secret == nil || secret.Data == nil {
		return nil, fmt.Errorf("no data found at path %s", path)
	}

	return secret.Data, nil
}
