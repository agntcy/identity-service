// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package converters

import (
	coreapi "github.com/agntcy/identity-saas/api/server/agntcy/identity-saas/core/v1alpha1"
	idtypes "github.com/agntcy/identity-saas/internal/core/id/types"
	"github.com/agntcy/identity-saas/internal/pkg/convertutil"
	"github.com/agntcy/identity-saas/internal/pkg/ptrutil"
)

func FromResolverMetadata(src *idtypes.ResolverMetadata) *coreapi.ResolverMetadata {
	if src == nil {
		return nil
	}

	return &coreapi.ResolverMetadata{
		Id:              ptrutil.Ptr(src.ID),
		AssertionMethod: src.AssertionMethod,
		VerificationMethod: convertutil.ConvertSlice(
			src.VerificationMethod,
			FromVerificationMethod,
		),
		Service: convertutil.ConvertSlice(
			src.Service,
			FromService,
		),
	}
}

func FromVerificationMethod(src *idtypes.VerificationMethod) *coreapi.VerificationMethod {
	if src == nil {
		return nil
	}

	return &coreapi.VerificationMethod{
		Id:           ptrutil.Ptr(src.ID),
		PublicKeyJwk: FromJwk(src.PublicKeyJwk),
	}
}

func FromService(src *idtypes.Service) *coreapi.Service {
	if src == nil {
		return nil
	}

	return &coreapi.Service{
		ServiceEndpoint: src.ServiceEndpoint,
	}
}

func FromJwk(src *idtypes.Jwk) *coreapi.Jwk {
	if src == nil {
		return nil
	}

	return &coreapi.Jwk{
		Alg:  ptrutil.Ptr(src.ALG),
		Kty:  ptrutil.Ptr(src.KTY),
		Use:  ptrutil.Ptr(src.USE),
		Kid:  ptrutil.Ptr(src.KID),
		Pub:  ptrutil.Ptr(src.PUB),
		Priv: ptrutil.Ptr(src.PRIV),
		Seed: ptrutil.Ptr(src.SEED),
		E:    ptrutil.Ptr(src.E),
		N:    ptrutil.Ptr(src.N),
		D:    ptrutil.Ptr(src.D),
		P:    ptrutil.Ptr(src.P),
		Q:    ptrutil.Ptr(src.Q),
		Dp:   ptrutil.Ptr(src.DP),
		Dq:   ptrutil.Ptr(src.DQ),
		Qi:   ptrutil.Ptr(src.QI),
	}
}

func ToJwk(src *coreapi.Jwk) *idtypes.Jwk {
	if src == nil {
		return nil
	}

	return &idtypes.Jwk{
		ALG:  ptrutil.DerefStr(src.Alg),
		KTY:  ptrutil.DerefStr(src.Kty),
		USE:  ptrutil.DerefStr(src.Use),
		KID:  ptrutil.DerefStr(src.Kid),
		PUB:  ptrutil.DerefStr(src.Pub),
		PRIV: ptrutil.DerefStr(src.Priv),
		SEED: ptrutil.DerefStr(src.Seed),
		E:    ptrutil.DerefStr(src.E),
		N:    ptrutil.DerefStr(src.N),
		D:    ptrutil.DerefStr(src.D),
		P:    ptrutil.DerefStr(src.P),
		Q:    ptrutil.DerefStr(src.Q),
		DP:   ptrutil.DerefStr(src.Dp),
		DQ:   ptrutil.DerefStr(src.Dq),
		QI:   ptrutil.DerefStr(src.Qi),
	}
}

func FromJwks(src *idtypes.Jwks) *coreapi.Jwks {
	if src == nil {
		return nil
	}

	return &coreapi.Jwks{
		Keys: convertutil.ConvertSlice(
			src.Keys,
			FromJwk,
		),
	}
}
