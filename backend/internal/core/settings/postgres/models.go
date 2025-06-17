// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/google/uuid"
)

type IssuerSettings struct {
	ID              uuid.UUID              `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID        string                 `gorm:"not null;type:varchar(256);"`
	IssuerID        *string                `gorm:"type:varchar(256);"`
	IdpType         types.IdpType          `gorm:"not null;type:uint;default:0;"`
	DuoIdpSettings  *types.DuoIdpSettings  `gorm:"embedded;embeddedPrefix:duo_"`
	OktaIdpSettings *types.OktaIdpSettings `gorm:"embedded;embeddedPrefix:okta_"`
}

func (i *IssuerSettings) ToCoreType() *types.IssuerSettings {
	if i == nil {
		return nil
	}

	return &types.IssuerSettings{
		IssuerID:        ptrutil.DerefStr(i.IssuerID),
		IdpType:         i.IdpType,
		DuoIdpSettings:  i.DuoIdpSettings,
		OktaIdpSettings: i.OktaIdpSettings,
	}
}

func newIssuerSettingsModel(src *types.IssuerSettings) *IssuerSettings {
	return &IssuerSettings{
		IssuerID:        ptrutil.Ptr(src.IssuerID),
		IdpType:         src.IdpType,
		DuoIdpSettings:  src.DuoIdpSettings,
		OktaIdpSettings: src.OktaIdpSettings,
	}
}
