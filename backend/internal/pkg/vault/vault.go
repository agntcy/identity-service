// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package vault

import (
	"context"
	"fmt"
	"net"

	hashi "github.com/hashicorp/vault/api"
)

const (
	mountPath = "secret"
)

type VaultClient interface {
	Put(
		ctx context.Context,
		secretPath string,
		data map[string]any,
	) error
	Get(
		ctx context.Context,
		secretPath string,
	) (map[string]any, error)
	Delete(
		ctx context.Context,
		secretPath string,
	) error
}

type HashicorpVaultClient struct {
	client *hashi.Client
}

func NewHashicorpVaultService(
	vaultHost, vaultPort string,
	vaultUseSSL bool, token string,
) (VaultClient, error) {
	vaultProtocol := "http:"
	if vaultUseSSL {
		vaultProtocol = "https:"
	}

	config := &hashi.Config{
		Address: fmt.Sprintf("%s//%s", vaultProtocol, net.JoinHostPort(vaultHost, vaultPort)),
	}

	client, err := hashi.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("unable to initialize Hashicorp Valut client: %w", err)
	}

	if token != "" {
		client.SetToken(token)
	}

	return &HashicorpVaultClient{
		client: client,
	}, nil
}

func (v *HashicorpVaultClient) Put(
	ctx context.Context,
	secretPath string,
	data map[string]any,
) error {
	_, err := v.client.KVv2(mountPath).Put(ctx, secretPath, data)
	return err
}

func (v *HashicorpVaultClient) Get(
	ctx context.Context,
	secretPath string,
) (map[string]any, error) {
	secret, err := v.client.KVv2(mountPath).Get(ctx, secretPath)
	if err != nil {
		return nil, err
	}

	return secret.Data, nil
}

func (v *HashicorpVaultClient) Delete(
	ctx context.Context,
	secretPath string,
) error {
	return v.client.KVv2(mountPath).Delete(ctx, secretPath)
}
