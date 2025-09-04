// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/core/settings/types"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/secrets"
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
	OryIdpSettingsID  *uuid.UUID `gorm:"foreignKey:ID"`
	OryIdpSettings    *OryIdpSettings
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

type OryIdpSettings struct {
	ID          uuid.UUID                `gorm:"primaryKey;default:gen_random_uuid()"`
	ProjectSlug string                   `gorm:"not null;type:varchar(256);"`
	ApiKey      *secrets.EncryptedString `gorm:"type:varchar(4096);"`
}

type Device struct {
	ID                uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID          string    `gorm:"not null;type:varchar(256);"`
	UserID            *string   `gorm:"not null;type:varchar(256);"`
	SubscriptionToken string    `gorm:"not null;type:varchar(256);"`
}

func (i *OktaIdpSettings) ToCoreType(crypter secrets.Crypter) *types.OktaIdpSettings {
	if i == nil {
		return nil
	}

	return &types.OktaIdpSettings{
		OrgUrl:     i.OrgUrl,
		ClientID:   i.ClientID,
		PrivateKey: ptrutil.DerefStr(secrets.EncryptedStringToRaw(i.PrivateKey, crypter)),
	}
}

func (i *DuoIdpSettings) ToCoreType(crypter secrets.Crypter) *types.DuoIdpSettings {
	if i == nil {
		return nil
	}

	return &types.DuoIdpSettings{
		Hostname:       i.Hostname,
		IntegrationKey: i.IntegrationKey,
		SecretKey:      ptrutil.DerefStr(secrets.EncryptedStringToRaw(i.SecretKey, crypter)),
	}
}

func (i *OryIdpSettings) ToCoreType(crypter secrets.Crypter) *types.OryIdpSettings {
	if i == nil {
		return nil
	}

	return &types.OryIdpSettings{
		ProjectSlug: i.ProjectSlug,
		ApiKey:      ptrutil.DerefStr(secrets.EncryptedStringToRaw(i.ApiKey, crypter)),
	}
}

func (i *IssuerSettings) ToCoreType(crypter secrets.Crypter) *types.IssuerSettings {
	if i == nil {
		return nil
	}

	return &types.IssuerSettings{
		IssuerID:        ptrutil.DerefStr(i.IssuerID),
		KeyID:           ptrutil.DerefStr(i.KeyID),
		IdpType:         i.IdpType,
		DuoIdpSettings:  i.DuoIdpSettings.ToCoreType(crypter),
		OktaIdpSettings: i.OktaIdpSettings.ToCoreType(crypter),
		OryIdpSettings:  i.OryIdpSettings.ToCoreType(crypter),
	}
}

func newOktaIdpSettingsModel(src *types.OktaIdpSettings, crypter secrets.Crypter) *OktaIdpSettings {
	if src == nil {
		return nil
	}

	return &OktaIdpSettings{
		OrgUrl:     src.OrgUrl,
		ClientID:   src.ClientID,
		PrivateKey: secrets.NewEncryptedString(&src.PrivateKey, crypter),
	}
}

func newDuoIdpSettingsModel(src *types.DuoIdpSettings, crypter secrets.Crypter) *DuoIdpSettings {
	if src == nil {
		return nil
	}

	return &DuoIdpSettings{
		Hostname:       src.Hostname,
		IntegrationKey: src.IntegrationKey,
		SecretKey:      secrets.NewEncryptedString(&src.SecretKey, crypter),
	}
}

func newOryIdpSettingsModel(src *types.OryIdpSettings, crypter secrets.Crypter) *OryIdpSettings {
	if src == nil {
		return nil
	}

	return &OryIdpSettings{
		ProjectSlug: src.ProjectSlug,
		ApiKey:      secrets.NewEncryptedString(&src.ApiKey, crypter),
	}
}

func newIssuerSettingsModel(src *types.IssuerSettings, crypter secrets.Crypter) *IssuerSettings {
	return &IssuerSettings{
		IssuerID:        ptrutil.Ptr(src.IssuerID),
		KeyID:           ptrutil.Ptr(src.KeyID),
		IdpType:         src.IdpType,
		DuoIdpSettings:  newDuoIdpSettingsModel(src.DuoIdpSettings, crypter),
		OktaIdpSettings: newOktaIdpSettingsModel(src.OktaIdpSettings, crypter),
		OryIdpSettings:  newOryIdpSettingsModel(src.OryIdpSettings, crypter),
	}
}
