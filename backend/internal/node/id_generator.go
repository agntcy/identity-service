// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package node

import (
	"context"
	"errors"
	"fmt"

	errcore "github.com/agntcy/identity-saas/internal/core/errors"
	errtypes "github.com/agntcy/identity-saas/internal/core/errors/types"
	issuercore "github.com/agntcy/identity-saas/internal/core/issuer"
	issuertypes "github.com/agntcy/identity-saas/internal/core/issuer/types"
	vctypes "github.com/agntcy/identity-saas/internal/core/vc/types"
	"github.com/agntcy/identity-saas/internal/pkg/errutil"
	"github.com/agntcy/identity-saas/internal/pkg/oidc"
	"github.com/agntcy/identity-saas/pkg/log"
)

// All IDP schemes supported by the ID generator.
// The ID generator creates IDs based on the proof and issuer information.
const (
	OktaScheme = "OKTA-"
	DuoScheme  = "DUO-"
	SelfScheme = "AGNTCY-"
)

type IDGenerator interface {
	GenerateFromProof(
		ctx context.Context,
		proof *vctypes.Proof,
	) (string, *issuertypes.Issuer, error)
}

type idGenerator struct {
	oidcParser       oidc.Parser
	issuerRepository issuercore.Repository
}

func NewIDGenerator(oidcParser oidc.Parser, issuerRepository issuercore.Repository) IDGenerator {
	return &idGenerator{
		oidcParser:       oidcParser,
		issuerRepository: issuerRepository,
	}
}

func (g *idGenerator) GenerateFromProof(
	ctx context.Context,
	proof *vctypes.Proof,
) (string, *issuertypes.Issuer, error) {
	if proof == nil {
		return "", nil, errutil.ErrInfo(
			errtypes.ERROR_REASON_INVALID_PROOF,
			"a proof is required to generate an ID",
			nil,
		)
	}

	log.Debug("Verifying the proof ", proof.ProofValue)

	if proof.IsJWT() {
		// Parse JWT to extract the common name and issuer information
		jwt := g.oidcParser.ParseJwt(ctx, &proof.ProofValue)
		if jwt == nil {
			return "", nil, errutil.ErrInfo(
				errtypes.ERROR_REASON_INVALID_PROOF,
				"failed to parse JWT",
				nil,
			)
		}

		issuer, err := g.getIssuer(ctx, jwt.CommonName)
		if err != nil {
			return "", nil, err
		}

		// Verify the JWT signature
		err = g.oidcParser.VerifyJwt(ctx, jwt, issuer.PublicKey.Jwks().String())
		if err != nil {
			return "", nil, errutil.ErrInfo(errtypes.ERROR_REASON_INVALID_PROOF, err.Error(), err)
		}

		var scheme string

		switch jwt.Provider {
		case oidc.OktaProviderName:
			scheme = OktaScheme
		case oidc.DuoProviderName:
			scheme = DuoScheme
		case oidc.SelfProviderName:
			scheme = SelfScheme
		default:
			return "", nil, errutil.ErrInfo(
				errtypes.ERROR_REASON_UNKNOWN_IDP,
				"unknown JWT provider name",
				nil,
			)
		}

		log.Debug("Issuer is verified: ", issuer.Verified)
		log.Debug("JWT scheme: ", scheme)

		// If the issuer is verified
		// we require a valid proof from the IdP
		if issuer.Verified && scheme == SelfScheme {
			return "", nil, errutil.ErrInfo(
				errtypes.ERROR_REASON_IDP_REQUIRED,
				"the issuer is verified so the proof must be from an IdP",
				nil,
			)
		}

		return fmt.Sprintf("%s%s", scheme, jwt.Claims.Subject), issuer, nil
	}

	return "", nil, errutil.ErrInfo(
		errtypes.ERROR_REASON_UNSUPPORTED_PROOF,
		fmt.Sprintf("unsupported proof type: %s", proof.Type),
		nil,
	)
}

func (g *idGenerator) getIssuer(
	ctx context.Context,
	commonName string,
) (*issuertypes.Issuer, error) {
	issuer, err := g.issuerRepository.GetIssuer(ctx, commonName)
	if err != nil {
		if errors.Is(err, errcore.ErrResourceNotFound) {
			return nil, errutil.ErrInfo(
				errtypes.ERROR_REASON_ISSUER_NOT_REGISTERED,
				fmt.Sprintf("the issuer %s is not registered", commonName),
				err,
			)
		}

		return nil, errutil.ErrInfo(errtypes.ERROR_REASON_INTERNAL, "unexpected error", err)
	}

	return issuer, nil
}
