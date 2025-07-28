// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package badge

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/outshift/identity-service/internal/core/badge/types"
	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/google/uuid"
)

func Issue(
	appID string,
	issuer string,
	typ types.BadgeType,
	claims *types.BadgeClaims,
	privateKey *jwk.Jwk,
) (*types.Badge, error) {
	if typ == types.BADGE_TYPE_UNSPECIFIED {
		return nil, errors.New("unsupported badge type")
	}

	if claims == nil {
		return nil, errors.New("invalid badge claims")
	}

	if privateKey == nil {
		return nil, errors.New("invalid privateKey argument")
	}

	vc := types.VerifiableCredential{
		Context: []string{
			"https://www.w3.org/ns/credentials/v2",
			"https://www.w3.org/ns/credentials/examples/v2",
		},
		ID:                uuid.NewString(),
		IssuanceDate:      time.Now().UTC().Format(time.RFC3339),
		Issuer:            issuer,
		Type:              []string{typ.String()},
		CredentialSubject: claims,
	}

	err := sign(&vc, privateKey)
	if err != nil {
		return nil, err
	}

	return &types.Badge{
		VerifiableCredential: vc,
		AppID:                appID,
	}, nil
}

func sign(vc *types.VerifiableCredential, privateKey *jwk.Jwk) error {
	// Make sure to erease any existing proof
	vc.Proof = nil

	payload, err := json.Marshal(vc)
	if err != nil {
		return fmt.Errorf("unable to marshal badge: %w", err)
	}

	signed, err := joseutil.Sign(privateKey, payload)
	if err != nil {
		return fmt.Errorf("unable to sign the badge: %w", err)
	}

	vc.Proof = &types.Proof{
		Type:       types.JoseProof,
		ProofValue: string(signed),
	}

	return nil
}
