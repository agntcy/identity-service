// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
)

type OktaIdpSettings struct {
	ID        string `gorm:"primaryKey"`
	TenantID  string `gorm:"not null;type:varchar(256);"`
	Domain    string `gorm:"not null;type:varchar(256);"`
	ApiKey    string `gorm:"not null;type:varchar(256);"`
	ApiSecret string `gorm:"not null;type:varchar(256);"`
}

func (o *OktaIdpSettings) ToCoreType() *types.OktaIdpSettings {
	return &types.OktaIdpSettings{
		Domain:    o.Domain,
		ApiKey:    o.ApiKey,
		ApiSecret: o.ApiSecret,
	}
}

type DuoIdpSettings struct {
	ID             string `gorm:"primaryKey"`
	TenantID       string `gorm:"not null;type:varchar(256);"`
	Host           string `gorm:"not null;type:varchar(256);"`
	IntegrationKey string `gorm:"not null;type:varchar(256);"`
	SecretKey      string `gorm:"not null;type:varchar(256);"`
}

func (d *DuoIdpSettings) ToCoreType() *types.DuoIdpSettings {
	return &types.DuoIdpSettings{
		Host:           d.Host,
		IntegrationKey: d.IntegrationKey,
		SecretKey:      d.SecretKey,
	}
}

type IssuerSettings struct {
	ID              string           `gorm:"primaryKey"`
	TenantID        string           `gorm:"not null;type:varchar(256);"`
	IssuerID        *string          `gorm:"type:varchar(256);"`
	IdpType         types.IdpType    `gorm:"not null;type:uint;default:0;"`
	DuoIdpSettings  *DuoIdpSettings  `gorm:"foreignKey:ID"`
	OktaIdpSettings *OktaIdpSettings `gorm:"foreignKey:ID"`
}

func (i *IssuerSettings) ToCoreType() *types.IssuerSettings {
	return &types.IssuerSettings{
		IssuerID:        ptrutil.DerefStr(i.IssuerID),
		IdpType:         i.IdpType,
		DuoIdpSettings:  i.DuoIdpSettings.ToCoreType(),
		OktaIdpSettings: i.OktaIdpSettings.ToCoreType(),
	}
}

func newIssuerSettingsModel(src *types.IssuerSettings) *IssuerSettings {
	return &IssuerSettings{
		IssuerID:        ptrutil.Ptr(src.IssuerID),
		IdpType:         src.IdpType,
		DuoIdpSettings:  convertutil.Convert[DuoIdpSettings](src.DuoIdpSettings),
		OktaIdpSettings: convertutil.Convert[OktaIdpSettings](src.OktaIdpSettings),
	}
}
