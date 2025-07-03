// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

//go:generate stringer -type=BadgeType
//go:generate stringer -type=CredentialStatusPurpose

package types

import (
	"slices"
	"strings"
	"time"
)

type Badge struct {
	VerifiableCredential `json:"verifiable_credential"`
	AppID                string `json:"app_id,omitempty"`
}

func (b *Badge) IsRevoked() bool {
	return slices.ContainsFunc(b.Status, func(status *CredentialStatus) bool {
		return status.Purpose == CREDENTIAL_STATUS_PURPOSE_REVOCATION
	})
}

// The purpose of the status entry
type CredentialStatusPurpose int

const (
	// Unspecified status purpose
	CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED CredentialStatusPurpose = iota

	// Used to cancel the validity of a verifiable credential.
	// This status is not reversible.
	CREDENTIAL_STATUS_PURPOSE_REVOCATION
)

func (t *CredentialStatusPurpose) UnmarshalText(text []byte) error {
	switch string(text) {
	case CREDENTIAL_STATUS_PURPOSE_REVOCATION.String():
		*t = CREDENTIAL_STATUS_PURPOSE_REVOCATION
	default:
		*t = CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED
	}

	return nil
}

func (t CredentialStatusPurpose) MarshalText() ([]byte, error) {
	return []byte(t.String()), nil
}

// CredentialStatus represents the credentialStatus property of a Verifiable Credential.
// more information can be found [here]
//
// [here]: https://www.w3.org/TR/vc-data-model-2.0/#status
type CredentialStatus struct {
	// The URL identifying the schema file
	ID string `json:"id" protobuf:"bytes,1,opt,name=id"`

	// Type specifies the type of the file
	Type string `json:"type" protobuf:"bytes,2,opt,name=type"`

	// The creation date and time of the status
	CreatedAt time.Time `json:"createdAt" protobuf:"google.protobuf.Timestamp,3,opt,name=created_at"`

	// The value of the purpose for the status entry
	Purpose CredentialStatusPurpose `json:"purpose" protobuf:"bytes,4,opt,name=purpose"`
}

// DataModel represents the W3C Verifiable Credential Data Model defined [here]
//
// [here]: https://www.w3.org/TR/vc-data-model/
type VerifiableCredential struct {
	// https://www.w3.org/TR/vc-data-model/#contexts
	Context []string `json:"context" protobuf:"bytes,1,opt,name=context"`

	// https://www.w3.org/TR/vc-data-model/#dfn-type
	Type []string `json:"type" protobuf:"bytes,2,opt,name=type"`

	// https://www.w3.org/TR/vc-data-model/#issuer
	Issuer string `json:"issuer" protobuf:"bytes,3,opt,name=issuer"`

	// https://www.w3.org/TR/vc-data-model/#credential-subject
	CredentialSubject *BadgeClaims `json:"credentialSubject" protobuf:"bytes,4,opt,name=credential_subject"`

	// https://www.w3.org/TR/vc-data-model/#identifiers
	ID string `json:"id,omitempty" protobuf:"bytes,5,opt,name=id"`

	// https://www.w3.org/TR/vc-data-model/#issuance-date
	IssuanceDate string `json:"issuanceDate" protobuf:"bytes,6,opt,name=issuance_date"`

	// https://www.w3.org/TR/vc-data-model/#expiration
	ExpirationDate string `json:"expirationDate,omitempty" protobuf:"bytes,7,opt,name=expiration_date"`

	// https://www.w3.org/TR/vc-data-model-2.0/#data-schemas
	CredentialSchema []*CredentialSchema `json:"credentialSchema,omitempty" protobuf:"bytes,8,opt,name=credential_schema"`

	// https://www.w3.org/TR/vc-data-model-2.0/#status
	Status []*CredentialStatus `json:"credentialStatus,omitempty" protobuf:"bytes,9,opt,name=credential_status"`

	// https://w3id.org/security#proof
	Proof *Proof `json:"proof,omitempty" protobuf:"bytes,10,opt,name=proof"`
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
	Type string `json:"type" protobuf:"bytes,1,opt,name=type"`

	// The proof purpose
	ProofPurpose string `json:"proofPurpose" protobuf:"bytes,2,opt,name=proof_purpose"`

	// The proof value
	ProofValue string `json:"proofValue" protobuf:"bytes,3,opt,name=proof_value"`
}

const JoseProof = "jwt"

func (p *Proof) IsJOSE() bool {
	return strings.EqualFold(p.Type, JoseProof)
}

// The content of the Credential.
// Multiple content types can be supported: AgentBadge, etc.
type BadgeType int

const (
	// Unspecified Content Type.
	BADGE_TYPE_UNSPECIFIED BadgeType = iota

	// AgentBadge Content Type.
	// The Agent content representation following a defined schema
	// OASF: https://schema.oasf.agntcy.org/schema/objects/agent
	// Google A2A: https://github.com/google/A2A/blob/main/specification/json/a2a.json
	BADGE_TYPE_AGENT_BADGE

	// McpBadge Content Type.
	// The MCP content representation following a defined schema
	// The schema is defined in the MCP specification as the MCPServer type
	BADGE_TYPE_MCP_BADGE
)
