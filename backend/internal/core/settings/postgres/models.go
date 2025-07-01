// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/internal/pkg/secrets"
	"github.com/google/uuid"
)

type IssuerSettings struct {
	ID                uuid.UUID     `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID          string        `gorm:"not null;type:varchar(256);"`
	IssuerID          *string       `gorm:"type:varchar(256);"`
	KeyID             *string       `gorm:"type:varchar(256);"`
	IdpType           types.IdpType `gorm:"not null;type:uint;default:0;"`
	DuoIdpSettingsID  *uuid.UUID    `gorm:"foreignKey:ID"`
	DuoIdpSettings    *DuoIdpSettings
	OktaIdpSettingsID *uuid.UUID `gorm:"foreignKey:ID"`
	OktaIdpSettings   *OktaIdpSettings
}

type DuoIdpSettings struct {
	ID             uuid.UUID                `gorm:"primaryKey;default:gen_random_uuid()"`
	Hostname       string                   `gorm:"type:varchar(256);"`
	IntegrationKey string                   `gorm:"type:varchar(256);"`
	SecretKey      *secrets.EncryptedString `gorm:"type:varchar(2048);"`
}

type OktaIdpSettings struct {
	ID         uuid.UUID                `gorm:"primaryKey;default:gen_random_uuid()"`
	OrgUrl     string                   `gorm:"type:varchar(256);"`
	ClientID   string                   `gorm:"type:varchar(256);"`
	PrivateKey *secrets.EncryptedString `gorm:"type:varchar(4096);"`
}

type Device struct {
	ID                uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID          string    `gorm:"not null;type:varchar(256);"`
	UserID            *string   `gorm:"not null;type:varchar(256);"`
	SubscriptionToken string    `gorm:"not null;type:varchar(256);"`
}

func (i *OktaIdpSettings) ToCoreType() *types.OktaIdpSettings {
	if i == nil {
		return nil
	}

	return &types.OktaIdpSettings{
		OrgUrl:     i.OrgUrl,
		ClientID:   i.ClientID,
		PrivateKey: ptrutil.DerefStr(secrets.ToString(i.PrivateKey)),
	}
}

func (i *DuoIdpSettings) ToCoreType() *types.DuoIdpSettings {
	if i == nil {
		return nil
	}

	return &types.DuoIdpSettings{
		Hostname:       i.Hostname,
		IntegrationKey: i.IntegrationKey,
		SecretKey:      ptrutil.DerefStr(secrets.ToString(i.SecretKey)),
	}
}

func (i *IssuerSettings) ToCoreType() *types.IssuerSettings {
	if i == nil {
		return nil
	}

	return &types.IssuerSettings{
		IssuerID:        ptrutil.DerefStr(i.IssuerID),
		KeyID:           ptrutil.DerefStr(i.KeyID),
		IdpType:         i.IdpType,
		DuoIdpSettings:  i.DuoIdpSettings.ToCoreType(),
		OktaIdpSettings: i.OktaIdpSettings.ToCoreType(),
	}
}

func newOktaIdpSettingsModel(src *types.OktaIdpSettings) *OktaIdpSettings {
	if src == nil {
		return nil
	}

	return &OktaIdpSettings{
		OrgUrl:     src.OrgUrl,
		ClientID:   src.ClientID,
		PrivateKey: secrets.FromString(ptrutil.Ptr(src.PrivateKey)),
	}
}

func newDuoIdpSettingsModel(src *types.DuoIdpSettings) *DuoIdpSettings {
	if src == nil {
		return nil
	}

	return &DuoIdpSettings{
		Hostname:       src.Hostname,
		IntegrationKey: src.IntegrationKey,
		SecretKey:      secrets.FromString(ptrutil.Ptr(src.SecretKey)),
	}
}

func newIssuerSettingsModel(src *types.IssuerSettings) *IssuerSettings {
	return &IssuerSettings{
		IssuerID:        ptrutil.Ptr(src.IssuerID),
		KeyID:           ptrutil.Ptr(src.KeyID),
		IdpType:         src.IdpType,
		DuoIdpSettings:  newDuoIdpSettingsModel(src.DuoIdpSettings),
		OktaIdpSettings: newOktaIdpSettingsModel(src.OktaIdpSettings),
	}
}
