// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/id/types"
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	vc "github.com/agntcy/identity-platform/internal/core/vc/postgres"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type ResolverMetadata struct {
	ID                 string                     `gorm:"primaryKey"`
	VerificationMethod []*VerificationMethod      `gorm:"foreignKey:ResolverMetadataID"`
	Service            []*Service                 `gorm:"foreignKey:ResolverMetadataID"`
	VC                 []*vc.VerifiableCredential `gorm:"foreignKey:ResolverMetadataID"`
	AssertionMethod    pq.StringArray             `gorm:"type:text[]"`
	Controller         string
}

func (md *ResolverMetadata) ToCoreType() *types.ResolverMetadata {
	return &types.ResolverMetadata{
		ID: md.ID,
		VerificationMethod: convertutil.ConvertSlice(
			md.VerificationMethod,
			func(vm *VerificationMethod) *types.VerificationMethod {
				return vm.ToCoreType()
			},
		),
		Service: convertutil.ConvertSlice(
			md.Service,
			func(s *Service) *types.Service {
				return s.ToCoreType()
			},
		),
		AssertionMethod: md.AssertionMethod,
	}
}

type VerificationMethod struct {
	ID                 string     `gorm:"primaryKey"`
	PublicKeyJwk       *types.Jwk `gorm:"embedded;embeddedPrefix:public_key_jwk_"`
	ResolverMetadataID string
}

func (vm *VerificationMethod) ToCoreType() *types.VerificationMethod {
	return &types.VerificationMethod{
		ID:           vm.ID,
		PublicKeyJwk: vm.PublicKeyJwk,
	}
}

type Service struct {
	ID                 string         `gorm:"primaryKey"`
	ServiceEndpoint    pq.StringArray `gorm:"type:text[]"`
	ResolverMetadataID string
}

func (s *Service) ToCoreType() *types.Service {
	return &types.Service{
		ServiceEndpoint: s.ServiceEndpoint,
	}
}

func newResolverMetadataModel(
	src *types.ResolverMetadata,
	issuer *issuertypes.Issuer,
) *ResolverMetadata {
	return &ResolverMetadata{
		ID: src.ID,
		VerificationMethod: convertutil.ConvertSlice(
			src.VerificationMethod,
			newVerificationMethodModel,
		),
		Service:         convertutil.ConvertSlice(src.Service, newServiceModel),
		AssertionMethod: src.AssertionMethod,
		Controller:      issuer.CommonName,
	}
}

func newVerificationMethodModel(src *types.VerificationMethod) *VerificationMethod {
	return &VerificationMethod{
		ID:           src.ID,
		PublicKeyJwk: src.PublicKeyJwk,
	}
}

func newServiceModel(src *types.Service) *Service {
	return &Service{
		ID:              uuid.NewString(),
		ServiceEndpoint: src.ServiceEndpoint,
	}
}
