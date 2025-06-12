// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package keystore

import (
	"errors"
	"fmt"

	"github.com/hashicorp/vault/api"
)

type StorageType int

const (
	FileStorage StorageType = iota
	VaultStorage
)

func (s StorageType) String() string {
	return [...]string{"file", "vault"}[s]
}

type FileStorageConfig struct {
	FilePath string
}

func NewKeyService(storageType StorageType, config interface{}) (KeyService, error) {
	switch storageType {
	case FileStorage:
		c, err := getConfig[FileStorageConfig](config)
		if err != nil {
			return nil, err
		}

		return &LocalFileKeyService{FilePath: c.FilePath}, nil

	case VaultStorage:
		c, err := getConfig[VaultStorageConfig](config)
		if err != nil {
			return nil, err
		}

		vaultConfig := api.DefaultConfig()
		if c.Address != "" {
			vaultConfig.Address = c.Address
		}

		client, err := api.NewClient(vaultConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create Vault client: %w", err)
		}

		if c.Token != "" {
			client.SetToken(c.Token)
		}

		if c.Namespace != "" {
			client.SetNamespace(c.Namespace)
		}

		mountPath := c.MountPath
		if mountPath == "" {
			mountPath = "secret"
		}

		keyBasePath := c.KeyBasePath
		if keyBasePath == "" {
			keyBasePath = "jwks"
		}

		return &VaultKeyService{
			client:      client,
			mountPath:   mountPath,
			keyBasePath: keyBasePath,
		}, nil
	default:
		return nil, fmt.Errorf("unsupported storage type: %s", storageType)
	}
}

func getConfig[T any](config interface{}) (T, error) {
	var zero T

	if config == nil {
		return zero, errors.New("nil config provided")
	}

	if c, ok := config.(T); ok {
		return c, nil
	}

	return zero, fmt.Errorf("invalid config type: expected %T", zero)
}
