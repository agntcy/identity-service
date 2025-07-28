// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"encoding/json"
	"time"

	app "github.com/outshift/identity-service/internal/core/app/postgres"
	"github.com/outshift/identity-service/internal/core/badge/types"
	"github.com/outshift/identity-service/internal/pkg/convertutil"
	"github.com/outshift/identity-service/pkg/log"
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
	Status            []*CredentialStatus `gorm:"foreignKey:VerifiableCredentialID"`
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
			Status: convertutil.ConvertSlice(
				bm.Status,
				func(s *CredentialStatus) *types.CredentialStatus {
					return s.ToCoreType()
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

type CredentialStatus struct {
	ID                     string `gorm:"primaryKey"`
	VerifiableCredentialID string `gorm:"primaryKey"`
	Type                   string
	CreatedAt              time.Time
	Purpose                types.CredentialStatusPurpose
}

func (s *CredentialStatus) ToCoreType() *types.CredentialStatus {
	return &types.CredentialStatus{
		ID:        s.ID,
		Type:      s.Type,
		CreatedAt: s.CreatedAt,
		Purpose:   s.Purpose,
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
			func(schema *types.CredentialSchema) *CredentialSchema {
				return newCredentialSchemaModel(schema, src.ID)
			},
		),
		Status: convertutil.ConvertSlice(
			src.Status,
			func(status *types.CredentialStatus) *CredentialStatus {
				return newCredentialStatusModel(status, src.ID)
			},
		),
		Proof:    src.Proof,
		TenantID: tenantID,
		AppID:    src.AppID,
	}
}

func newCredentialSchemaModel(src *types.CredentialSchema, verifiableCredentialID string) *CredentialSchema {
	return &CredentialSchema{
		ID:                     src.ID,
		Type:                   src.Type,
		VerifiableCredentialID: verifiableCredentialID,
	}
}

func newCredentialStatusModel(src *types.CredentialStatus, verifiableCredentialID string) *CredentialStatus {
	return &CredentialStatus{
		ID:                     src.ID,
		Type:                   src.Type,
		VerifiableCredentialID: verifiableCredentialID,
		CreatedAt:              src.CreatedAt,
		Purpose:                src.Purpose,
	}
}
