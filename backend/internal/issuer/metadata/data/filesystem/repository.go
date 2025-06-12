// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package filesystem

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/agntcy/identity-platform/internal/issuer/metadata/data"

	internalIssuerConstants "github.com/agntcy/identity-platform/internal/issuer/constants"
	issuerFilesystemRepository "github.com/agntcy/identity-platform/internal/issuer/issuer/data/filesystem"
	"github.com/agntcy/identity-platform/internal/issuer/metadata/types"
)

type metadataFilesystemRepository struct{}

func NewMetadataFilesystemRepository() data.MetadataRepository {
	return &metadataFilesystemRepository{}
}

func getMetadataDirectory(vaultId, keyId, issuerId string) (string, error) {
	issuerIdDir, err := issuerFilesystemRepository.GetIssuerIdDirectory(vaultId, keyId, issuerId)
	if err != nil {
		return "", err
	}

	return filepath.Join(issuerIdDir, "metadata"), nil
}

func GetMetadataIdDirectory(vaultId, keyId, issuerId, metadataId string) (string, error) {
	metadataDir, err := getMetadataDirectory(vaultId, keyId, issuerId)
	if err != nil {
		return "", err
	}

	return filepath.Join(metadataDir, metadataId), nil
}

func GetMetadataFilePath(vaultId, keyId, issuerId, metadataId string) (string, error) {
	metadataIdDir, err := GetMetadataIdDirectory(vaultId, keyId, issuerId, metadataId)
	if err != nil {
		return "", err
	}

	return filepath.Join(metadataIdDir, "metadata.json"), nil
}

func (r *metadataFilesystemRepository) AddMetadata(
	vaultId, keyId, issuerId string, metadata *types.Metadata,
) (string, error) {
	metadataDir, err := getMetadataDirectory(vaultId, keyId, issuerId)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(metadataDir, internalIssuerConstants.DirPerm); err != nil {
		return "", err
	}

	// Create metadata ID directory
	metadataIdDir, err := GetMetadataIdDirectory(vaultId, keyId, issuerId, metadata.ID)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(metadataIdDir, internalIssuerConstants.DirPerm); err != nil {
		return "", err
	}

	// Save metadata to file
	metadataFilePath, err := GetMetadataFilePath(vaultId, keyId, issuerId, metadata.ID)
	if err != nil {
		return "", err
	}

	metadataData, err := json.Marshal(metadata)
	if err != nil {
		return "", err
	}

	err = os.WriteFile(metadataFilePath, metadataData, internalIssuerConstants.FilePerm)
	if err != nil {
		return "", err
	}

	return metadata.ID, nil
}

func (r *metadataFilesystemRepository) GetAllMetadata(
	vaultId, keyId, issuerId string,
) ([]*types.Metadata, error) {
	// Get the metadata directory
	metadataDir, err := getMetadataDirectory(vaultId, keyId, issuerId)
	if err != nil {
		return nil, err
	}

	// Read the metadata directory
	files, err := os.ReadDir(metadataDir)
	if err != nil {
		return nil, err
	}

	// List the metadata IDs
	var allMetadata []*types.Metadata

	for _, file := range files {
		if file.IsDir() {
			metadata, err := r.GetMetadata(vaultId, keyId, issuerId, file.Name())
			if err != nil {
				return nil, err
			}

			// Append the metadata to the list
			allMetadata = append(allMetadata, metadata)
		}
	}

	return allMetadata, nil
}

func (r *metadataFilesystemRepository) GetMetadata(
	vaultId, keyId, issuerId, metadataId string,
) (*types.Metadata, error) {
	// Get the metadata file path
	metadataFilePath, err := GetMetadataFilePath(vaultId, keyId, issuerId, metadataId)
	if err != nil {
		return nil, err
	}

	// Read the metadata file
	metadataData, err := os.ReadFile(metadataFilePath)
	if err != nil {
		return nil, err
	}

	// Unmarshal the metadata data
	var metadata types.Metadata
	if err := json.Unmarshal(metadataData, &metadata); err != nil {
		return nil, err
	}

	return &metadata, nil
}

func (r *metadataFilesystemRepository) RemoveMetadata(
	vaultId, keyId, issuerId, metadataId string,
) error {
	// Get the metadata directory
	metadataIdDir, err := GetMetadataIdDirectory(vaultId, keyId, issuerId, metadataId)
	if err != nil {
		return err
	}

	// Check if the metadata directory exists
	if _, err := os.Stat(metadataIdDir); os.IsNotExist(err) {
		return errors.New("metadata does not exist")
	}

	// Remove the metadata directory
	if err := os.RemoveAll(metadataIdDir); err != nil {
		return err
	}

	return nil
}
