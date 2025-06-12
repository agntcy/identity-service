// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package vc

import (
	"time"

	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	"github.com/agntcy/identity-platform/internal/core/vc/types"
	"github.com/google/uuid"
)

type VerifiableCredentialOption func(*types.VerifiableCredential) error

func New(options ...VerifiableCredentialOption) (*types.VerifiableCredential, error) {
	vc := &types.VerifiableCredential{
		Context: []string{
			"https://www.w3.org/ns/credentials/v2",
			"https://www.w3.org/ns/credentials/examples/v2",
		},
		ID:           uuid.NewString(),
		IssuanceDate: time.Now().UTC().Format(time.RFC3339),
	}
	for _, opt := range options {
		err := opt(vc)
		if err != nil {
			return nil, err
		}
	}

	return vc, nil
}

func WithIssuer(issuer *issuertypes.Issuer) VerifiableCredentialOption {
	return func(vc *types.VerifiableCredential) error {
		vc.Issuer = issuer.CommonName
		return nil
	}
}

func WithCredentialContent(
	content *types.CredentialContent,
) VerifiableCredentialOption {
	return func(vc *types.VerifiableCredential) error {
		vc.Type = append(vc.Type, content.Type.String())
		vc.CredentialSubject = content.Content

		return nil
	}
}

// Schemas can be used to include JSON Schemas within the Verifiable Credential created by [Create]
// more information can be found [here]
//
// [here]: https://www.w3.org/TR/vc-data-model-2.0/#data-schemas
func WithCredentialSchema(schemas ...string) VerifiableCredentialOption {
	return func(vc *types.VerifiableCredential) error {
		if vc.CredentialSchema != nil {
			vc.CredentialSchema = make([]*types.CredentialSchema, 0, len(schemas))
		}

		for _, schema := range schemas {
			vc.CredentialSchema = append(vc.CredentialSchema, &types.CredentialSchema{
				Type: "JsonSchema",
				ID:   schema,
			})
		}

		return nil
	}
}
