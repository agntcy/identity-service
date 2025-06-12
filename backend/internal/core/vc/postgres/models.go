// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"encoding/json"
	"time"

	"github.com/agntcy/identity-saas/internal/core/vc/types"
	"github.com/agntcy/identity-saas/internal/pkg/convertutil"
	"github.com/agntcy/identity-saas/pkg/log"
	"github.com/lib/pq"
)

type VerifiableCredential struct {
	ID                 string `gorm:"primarykey"`
	CreatedAt          time.Time
	Context            pq.StringArray `gorm:"type:text[]"`
	Type               pq.StringArray `gorm:"type:text[]"`
	Issuer             string
	CredentialSubject  json.RawMessage
	IssuanceDate       string
	ExpirationDate     string
	CredentialSchema   []*CredentialSchema `gorm:"foreignKey:VerifiableCredentialID"`
	Proof              *types.Proof        `gorm:"embedded;embeddedPrefix:proof_"`
	ResolverMetadataID string
}

func (vm *VerifiableCredential) ToCoreType() *types.VerifiableCredential {
	var sub map[string]any

	err := json.Unmarshal(vm.CredentialSubject, &sub)
	if err != nil {
		log.Warn(err)
	}

	return &types.VerifiableCredential{
		Context:           vm.Context,
		Type:              vm.Type,
		Issuer:            vm.Issuer,
		CredentialSubject: sub,
		ID:                vm.ID,
		IssuanceDate:      vm.IssuanceDate,
		ExpirationDate:    vm.ExpirationDate,
		CredentialSchema: convertutil.ConvertSlice(
			vm.CredentialSchema,
			func(c *CredentialSchema) *types.CredentialSchema {
				return c.ToCoreType()
			},
		),
		Proof: vm.Proof,
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

func newVerifiableCredentialModel(
	src *types.VerifiableCredential,
	resolverMetadataID string,
) *VerifiableCredential {
	sub, err := json.Marshal(src.CredentialSubject)
	if err != nil {
		log.Warn(err)
	}

	return &VerifiableCredential{
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
		Proof:              src.Proof,
		ResolverMetadataID: resolverMetadataID,
	}
}

func newCredentialSchemaModel(src *types.CredentialSchema) *CredentialSchema {
	return &CredentialSchema{
		ID:   src.ID,
		Type: src.Type,
	}
}
