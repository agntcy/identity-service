// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package filesystem

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/agntcy/identity-saas/internal/issuer/badge/data"
	internalIssuerConstants "github.com/agntcy/identity-saas/internal/issuer/constants"
	metadataFilesystemRepository "github.com/agntcy/identity-saas/internal/issuer/metadata/data/filesystem"
	internalIssuerTypes "github.com/agntcy/identity-saas/internal/issuer/types"
)

type badgeFilesystemRepository struct{}

func NewBadgeFilesystemRepository() data.BadgeRepository {
	return &badgeFilesystemRepository{}
}

// getBadgeDirectory returns the path to the badges directory for a metadata
func getBadgesDirectory(vaultId, keyId, issuerId, metadataId string) (string, error) {
	metadataIdDir, err := metadataFilesystemRepository.GetMetadataIdDirectory(
		vaultId,
		keyId,
		issuerId,
		metadataId,
	)
	if err != nil {
		return "", err
	}

	return filepath.Join(metadataIdDir, "badges"), nil
}

// GetBadgeIdDirectory returns the path to the badge ID directory
func GetBadgeIdDirectory(vaultId, keyId, issuerId, metadataId, badgeId string) (string, error) {
	badgesDir, err := getBadgesDirectory(vaultId, keyId, issuerId, metadataId)
	if err != nil {
		return "", err
	}

	return filepath.Join(badgesDir, badgeId), nil
}

// GetBadgeFilePath returns the path to the badge file
func GetBadgeFilePath(vaultId, keyId, issuerId, metadataId, badgeId string) (string, error) {
	badgeIdDir, err := GetBadgeIdDirectory(vaultId, keyId, issuerId, metadataId, badgeId)
	if err != nil {
		return "", err
	}

	return filepath.Join(badgeIdDir, "badge.json"), nil
}

func (r *badgeFilesystemRepository) AddBadge(
	vaultId, keyId, issuerId, metadataId string, badge *internalIssuerTypes.Badge,
) (string, error) {
	// Ensure badges directory exists
	badgesDir, err := getBadgesDirectory(vaultId, keyId, issuerId, metadataId)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(badgesDir, internalIssuerConstants.DirPerm); err != nil {
		return "", err
	}

	badgesIdDir, err := GetBadgeIdDirectory(vaultId, keyId, issuerId, metadataId, badge.Id)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(badgesIdDir, internalIssuerConstants.DirPerm); err != nil {
		return "", err
	}

	// Save badge to file
	badgeFilePath, err := GetBadgeFilePath(vaultId, keyId, issuerId, metadataId, badge.Id)
	if err != nil {
		return "", err
	}

	badgeData, err := json.Marshal(&badge)
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(badgeFilePath, badgeData, internalIssuerConstants.FilePerm); err != nil {
		return "", err
	}

	return badge.Id, nil
}

func (r *badgeFilesystemRepository) GetAllBadges(
	vaultId, keyId, issuerId, metadataId string,
) ([]*internalIssuerTypes.Badge, error) {
	// Get the badges directory
	badgesDir, err := getBadgesDirectory(vaultId, keyId, issuerId, metadataId)
	if err != nil {
		return nil, err
	}

	// Read the badges directory
	files, err := os.ReadDir(badgesDir)
	if err != nil {
		return nil, err
	}

	// List the badge IDs
	var badges []*internalIssuerTypes.Badge

	for _, file := range files {
		if file.IsDir() {
			badge, err := r.GetBadge(vaultId, keyId, issuerId, metadataId, file.Name())
			if err != nil {
				return nil, err
			}
			// Append the badge to the list
			badges = append(badges, badge)
		}
	}

	return badges, nil
}

func (r *badgeFilesystemRepository) GetBadge(
	vaultId, keyId, issuerId, metadataId, badgeId string,
) (*internalIssuerTypes.Badge, error) {
	// Get the badge file path
	badgeFilePath, err := GetBadgeFilePath(vaultId, keyId, issuerId, metadataId, badgeId)
	if err != nil {
		return nil, err
	}

	// Read the badge file
	badgeData, err := os.ReadFile(badgeFilePath)
	if err != nil {
		return nil, err
	}

	// Unmarshal the badge data
	var badge internalIssuerTypes.Badge
	if err := json.Unmarshal(badgeData, &badge); err != nil {
		return nil, err
	}

	return &badge, nil
}

func (r *badgeFilesystemRepository) RemoveBadge(
	vaultId, keyId, issuerId, metadataId, badgeId string,
) error {
	// Get the badge directory
	badgeIdDir, err := GetBadgeIdDirectory(vaultId, keyId, issuerId, metadataId, badgeId)
	if err != nil {
		return err
	}

	// Check if the badge directory exists
	if _, err := os.Stat(badgeIdDir); os.IsNotExist(err) {
		return errors.New("metadata does not exist")
	}

	// Remove the badge directory
	if err := os.RemoveAll(badgeIdDir); err != nil {
		return err
	}

	return nil
}
