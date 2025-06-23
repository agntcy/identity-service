// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

import (
	"strings"
)

// DataModel represents the W3C Verifiable Credential Data Model defined [here]
//
// [here]: https://www.w3.org/TR/vc-data-model/
type VerifiableCredential struct {
	// https://www.w3.org/TR/vc-data-model/#contexts
	Context []string `json:"context"`

	// https://www.w3.org/TR/vc-data-model/#dfn-type
	Type []string `json:"type"`

	// https://www.w3.org/TR/vc-data-model/#issuer
	Issuer string `json:"issuer"`

	// https://www.w3.org/TR/vc-data-model/#credential-subject
	CredentialSubject *BadgeClaims `json:"credentialSubject"`

	// https://www.w3.org/TR/vc-data-model/#identifiers
	ID string `json:"id,omitempty"`

	// https://www.w3.org/TR/vc-data-model/#issuance-date
	IssuanceDate string `json:"issuanceDate"`

	// https://www.w3.org/TR/vc-data-model/#expiration
	ExpirationDate string `json:"expirationDate,omitempty"`

	// https://www.w3.org/TR/vc-data-model-2.0/#data-schemas
	CredentialSchema []*CredentialSchema `json:"credentialSchema,omitempty"`

	// https://w3id.org/security#proof
	Proof *Proof `json:"proof,omitempty"`
}

// BadgeClaims represents the content of a Badge VC defined [here]
//
// [here]: https://spec.identity.agntcy.org/docs/vc/intro/
type BadgeClaims struct {
	// The ID as defined [here]
	//
	// [here]: https://www.w3.org/TR/vc-data-model/#credential-subject
	ID string `json:"id"`

	// The content of the badge
	Badge string `json:"badge"`
}

// CredentialSchema represents the credentialSchema property of a Verifiable Credential.
// more information can be found [here]
//
// [here]: https://www.w3.org/TR/vc-data-model-2.0/#data-schemas
type CredentialSchema struct {
	// Type specifies the type of the file
	Type string `json:"type"`

	// The URL identifying the schema file
	ID string `json:"id"`
}

// A data integrity proof provides information about the proof mechanism,
// parameters required to verify that proof, and the proof value itself.
type Proof struct {
	// The type of the proof
	Type string `json:"type"`

	// The proof purpose
	ProofPurpose string `json:"proofPurpose"`

	// The proof value
	ProofValue string `json:"proofValue"`
}

func (p *Proof) IsJOSE() bool {
	return strings.EqualFold(p.Type, "jwt")
}
