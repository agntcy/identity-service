// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

//go:generate stringer -type=BadgeType

package types

import (
	"strings"
)

type Badge struct {
	VerifiableCredential `json:"verifiable_credential"`
	AppID                string `json:"app_id,omitempty"`
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
	CredentialSubject *BadgeClaims `json:"credentialSubject" protobuf:"google.protobuf.Struct,4,opt,name=content"`

	// https://www.w3.org/TR/vc-data-model/#identifiers
	ID string `json:"id,omitempty" protobuf:"bytes,5,opt,name=id"`

	// https://www.w3.org/TR/vc-data-model/#issuance-date
	IssuanceDate string `json:"issuanceDate" protobuf:"bytes,6,opt,name=issuance_date"`

	// https://www.w3.org/TR/vc-data-model/#expiration
	ExpirationDate string `json:"expirationDate,omitempty" protobuf:"bytes,7,opt,name=expiration_date"`

	// https://www.w3.org/TR/vc-data-model-2.0/#data-schemas
	CredentialSchema []*CredentialSchema `json:"credentialSchema,omitempty" protobuf:"bytes,8,opt,name=credential_schema"`

	// https://w3id.org/security#proof
	Proof *Proof `json:"proof,omitempty" protobuf:"bytes,9,opt,name=proof"`
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
