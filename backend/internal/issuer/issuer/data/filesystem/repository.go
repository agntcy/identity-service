// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package filesystem

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	internalIssuerConstants "github.com/agntcy/identity-platform/internal/issuer/constants"
	"github.com/agntcy/identity-platform/internal/issuer/issuer/data"
	"github.com/agntcy/identity-platform/internal/issuer/issuer/types"
	vaultFilesystemRepository "github.com/agntcy/identity-platform/internal/issuer/vault/data/filesystem"
)

type issuerFilesystemRepository struct{}

func NewIssuerFilesystemRepository() data.IssuerRepository {
	return &issuerFilesystemRepository{}
}

// getIssuersDirectory returns the path to the issuers directory
func getIssuersDirectory(vaultId, keyId string) (string, error) {
	vaultIdDir, err := vaultFilesystemRepository.GetVaultIdDirectory(vaultId)
	if err != nil {
		return "", err
	}

	vaultKeyIdDir := filepath.Join(vaultIdDir, "keys", keyId)
	if _, err := os.Stat(vaultKeyIdDir); os.IsNotExist(err) {
		if err := os.MkdirAll(vaultKeyIdDir, internalIssuerConstants.DirPerm); err != nil {
			return "", err
		}
	}

	return filepath.Join(vaultKeyIdDir, "issuers"), nil
}

// GetIssuerIdDirectory returns the path to the issuer ID directory
func GetIssuerIdDirectory(vaultId, keyId, issuerId string) (string, error) {
	issuersDir, err := getIssuersDirectory(vaultId, keyId)
	if err != nil {
		return "", err
	}

	return filepath.Join(issuersDir, issuerId), nil
}

// GetIssuerFilePath returns the path to the issuer file
func GetIssuerFilePath(vaultId, keyId, issuerId string) (string, error) {
	issuerIdDir, err := GetIssuerIdDirectory(vaultId, keyId, issuerId)
	if err != nil {
		return "", err
	}

	return filepath.Join(issuerIdDir, "issuer.json"), nil
}

func (r *issuerFilesystemRepository) AddIssuer(
	vaultId, keyId string, issuer *types.Issuer,
) (string, error) {
	// Create idp locally in the issuer directory
	issuersDir, err := GetIssuerIdDirectory(vaultId, keyId, issuer.ID)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(issuersDir, internalIssuerConstants.DirPerm); err != nil {
		return "", err
	}

	issuerFilePath, err := GetIssuerFilePath(vaultId, keyId, issuer.ID)
	if err != nil {
		return "", err
	}

	// Marshal the config to JSON
	issuerData, err := json.Marshal(&issuer)
	if err != nil {
		return "", err
	}

	// Write the issuer to file
	if err := os.WriteFile(issuerFilePath, issuerData, internalIssuerConstants.FilePerm); err != nil {
		return "", err
	}

	return issuer.ID, nil
}

func (r *issuerFilesystemRepository) GetAllIssuers(vaultId, keyId string) ([]*types.Issuer, error) {
	// Get the issuers directory
	issuersDir, err := getIssuersDirectory(vaultId, keyId)
	if err != nil {
		return nil, err
	}

	// Read the issuers directory
	files, err := os.ReadDir(issuersDir)
	if err != nil {
		return nil, err
	}

	// List the issuer IDs
	var issuers []*types.Issuer

	for _, file := range files {
		if file.IsDir() {
			issuer, err := r.GetIssuer(vaultId, keyId, file.Name())
			if err != nil {
				return nil, err
			}
			// Append the issuer to the list
			issuers = append(issuers, issuer)
		}
	}

	return issuers, nil
}

func (r *issuerFilesystemRepository) GetIssuer(
	vaultId, keyId, issuerId string,
) (*types.Issuer, error) {
	// Get the issuer file path
	issuerFilePath, err := GetIssuerFilePath(vaultId, keyId, issuerId)
	if err != nil {
		return nil, err
	}

	// Read the issuer file
	issuerData, err := os.ReadFile(issuerFilePath)
	if err != nil {
		return nil, err
	}

	// Unmarshal the issuer data
	var issuer types.Issuer
	if err := json.Unmarshal(issuerData, &issuer); err != nil {
		return nil, err
	}

	return &issuer, nil
}

func (r *issuerFilesystemRepository) RemoveIssuer(vaultId, keyId, issuerId string) error {
	// Get the issuer directory
	issuerDir, err := GetIssuerIdDirectory(vaultId, keyId, issuerId)
	if err != nil {
		return err
	}

	// Check if the issuer directory exists
	if _, err := os.Stat(issuerDir); os.IsNotExist(err) {
		return errors.New("issuer does not exist")
	}

	// Remove the issuer directory
	if err := os.RemoveAll(issuerDir); err != nil {
		return err
	}

	return nil
}
