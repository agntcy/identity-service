// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	id "github.com/agntcy/identity-platform/internal/core/id/postgres"
	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	"github.com/agntcy/identity-platform/internal/core/issuer/types"
)

type Issuer struct {
	CommonName       string                 `gorm:"primaryKey"`
	Verified         bool                   `gorm:"not null;type:boolean;default:false"`
	Organization     string                 `gorm:"not null;type:varchar(256);"`
	SubOrganization  string                 `gorm:"not null;type:varchar(256);"`
	PublicKey        *idtypes.Jwk           `gorm:"embedded;embeddedPrefix:public_key_"`
	ResolverMetadata []*id.ResolverMetadata `gorm:"foreignKey:Controller"`
}

func (i *Issuer) ToCoreType() *types.Issuer {
	return &types.Issuer{
		CommonName:      i.CommonName,
		Verified:        i.Verified,
		Organization:    i.Organization,
		SubOrganization: i.SubOrganization,
		PublicKey:       i.PublicKey,
	}
}

func newIssuerModel(src *types.Issuer) *Issuer {
	return &Issuer{
		CommonName:      src.CommonName,
		Verified:        src.Verified,
		Organization:    src.Organization,
		SubOrganization: src.SubOrganization,
		PublicKey:       src.PublicKey,
	}
}
