// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"encoding/json"
	"time"

	app "github.com/agntcy/identity-platform/internal/core/app/postgres"
	"github.com/agntcy/identity-platform/internal/core/badge/types"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/pkg/log"
	"github.com/lib/pq"
)

type Badge struct {
	ID                string `gorm:"primarykey"`
	CreatedAt         time.Time
	Context           pq.StringArray `gorm:"type:text[]"`
	Type              pq.StringArray `gorm:"type:text[]"`
	Issuer            string
	CredentialSubject json.RawMessage
	IssuanceDate      string
	ExpirationDate    string
	CredentialSchema  []*CredentialSchema `gorm:"foreignKey:VerifiableCredentialID"`
	Proof             *types.Proof        `gorm:"embedded;embeddedPrefix:proof_"`
	TenantID          string              `gorm:"not null;type:varchar(256);index"`
	AppID             string
	App               app.App
}

func (bm *Badge) ToCoreType() *types.Badge {
	var sub types.BadgeClaims

	err := json.Unmarshal(bm.CredentialSubject, &sub)
	if err != nil {
		log.Warn(err)
	}

	return &types.Badge{
		VerifiableCredential: types.VerifiableCredential{
			Context:           bm.Context,
			Type:              bm.Type,
			Issuer:            bm.Issuer,
			CredentialSubject: &sub,
			ID:                bm.ID,
			IssuanceDate:      bm.IssuanceDate,
			ExpirationDate:    bm.ExpirationDate,
			CredentialSchema: convertutil.ConvertSlice(
				bm.CredentialSchema,
				func(c *CredentialSchema) *types.CredentialSchema {
					return c.ToCoreType()
				},
			),
			Proof: bm.Proof,
		},
		AppID: bm.AppID,
	}
}

type CredentialSchema struct {
	ID                     string `gorm:"primaryKey"`
	VerifiableCredentialID string `gorm:"primaryKey"`
	Type                   string
}

func (c *CredentialSchema) ToCoreType() *types.CredentialSchema {
	return &types.CredentialSchema{
		Type: c.Type,
		ID:   c.ID,
	}
}

func newBadgeModel(src *types.Badge, tenantID string) *Badge {
	sub, err := json.Marshal(src.CredentialSubject)
	if err != nil {
		log.Warn(err)
	}

	return &Badge{
		ID:                src.ID,
		CreatedAt:         time.Now().UTC(),
		Context:           src.Context,
		Type:              src.Type,
		Issuer:            src.Issuer,
		CredentialSubject: sub,
		IssuanceDate:      src.IssuanceDate,
		ExpirationDate:    src.ExpirationDate,
		CredentialSchema: convertutil.ConvertSlice(
			src.CredentialSchema,
			newCredentialSchemaModel,
		),
		Proof:    src.Proof,
		TenantID: tenantID,
		AppID:    src.AppID,
	}
}

func newCredentialSchemaModel(src *types.CredentialSchema) *CredentialSchema {
	return &CredentialSchema{
		ID:   src.ID,
		Type: src.Type,
	}
}
