// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package jose

import (
	"encoding/json"

	errtypes "github.com/agntcy/identity-saas/internal/core/errors/types"
	idtypes "github.com/agntcy/identity-saas/internal/core/id/types"
	vctypes "github.com/agntcy/identity-saas/internal/core/vc/types"
	"github.com/agntcy/identity-saas/internal/pkg/errutil"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jws"
)

func Verify(
	jwks *idtypes.Jwks,
	credential *vctypes.EnvelopedCredential,
) (*vctypes.VerifiableCredential, error) {
	// we assume the VC is not encrypted with JWE
	keys := jwks.Raw()
	if keys == nil {
		return nil, errutil.ErrInfo(errtypes.ERROR_REASON_INTERNAL, "unable to parse jwks", nil)
	}

	set, err := jwk.Parse(keys)
	if err != nil {
		return nil, errutil.ErrInfo(
			errtypes.ERROR_REASON_INTERNAL,
			"unable to parse the resolver metadata public key",
			err,
		)
	}

	_, err = jws.Verify([]byte(credential.Value), jws.WithKeySet(set))
	if err != nil {
		return nil, errutil.ErrInfo(
			errtypes.ERROR_REASON_INVALID_VERIFIABLE_CREDENTIAL,
			err.Error(),
			err,
		)
	}

	raw, err := jws.Parse([]byte(credential.Value))
	if err != nil {
		return nil, errutil.ErrInfo(
			errtypes.ERROR_REASON_INVALID_CREDENTIAL_ENVELOPE_VALUE_FORMAT,
			err.Error(),
			err,
		)
	}

	var validatedVC vctypes.VerifiableCredential

	err = json.Unmarshal(raw.Payload(), &validatedVC)
	if err != nil {
		return nil, errutil.ErrInfo(
			errtypes.ERROR_REASON_INVALID_CREDENTIAL_ENVELOPE_VALUE_FORMAT,
			err.Error(),
			err,
		)
	}

	validatedVC.Proof = &vctypes.Proof{
		Type:       "JWT",
		ProofValue: credential.Value,
	}

	return &validatedVC, nil
}
