// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	coreapi "github.com/agntcy/identity-saas/api/server/agntcy/identity-saas/core/v1alpha1"
	issuertypes "github.com/agntcy/identity-saas/internal/core/issuer/types"
	"github.com/agntcy/identity-saas/internal/pkg/ptrutil"
)

func FromIssuer(src *issuertypes.Issuer) *coreapi.Issuer {
	if src == nil {
		return nil
	}

	return &coreapi.Issuer{
		Organization:    ptrutil.Ptr(src.Organization),
		SubOrganization: ptrutil.Ptr(src.SubOrganization),
		CommonName:      ptrutil.Ptr(src.CommonName),
		PublicKey:       FromJwk(src.PublicKey),
	}
}

func ToIssuer(src *coreapi.Issuer) *issuertypes.Issuer {
	if src == nil {
		return nil
	}

	return &issuertypes.Issuer{
		Organization:    ptrutil.DerefStr(src.Organization),
		SubOrganization: ptrutil.DerefStr(src.SubOrganization),
		CommonName:      ptrutil.DerefStr(src.CommonName),
		PublicKey:       ToJwk(src.PublicKey),
	}
}
