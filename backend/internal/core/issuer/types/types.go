// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

import (
	"fmt"
	"net/mail"

	idtypes "github.com/agntcy/identity-saas/internal/core/id/types"
)

// A Identity Issuer
type Issuer struct {
	// The organization of the issuer
	Organization string `json:"organization,omitempty" protobuf:"bytes,1,opt,name=organization"`

	// The sub organization of the issuer
	SubOrganization string `json:"subOrganization,omitempty" protobuf:"bytes,2,opt,name=sub_organization"`

	// The common name of the issuer
	// Could be a FQDN or a FQDA
	CommonName string `json:"commonName,omitempty" protobuf:"bytes,3,opt,name=common_name"`

	// This will be set to true when issuer provides a valid proof of ownership
	// of the common name on registration
	Verified bool `json:"verified,omitempty" protobuf:"varint,6,opt,name=verified"`

	// This field is optional
	// The keys of the issuer in JWK format
	// The public key is used to verify the signature of the different claims
	PublicKey *idtypes.Jwk `json:"publicKey,omitempty" protobuf:"bytes,4,opt,name=public_key"`

	// This field is optional
	// The private key of the issuer in JWK format
	PrivateKey *idtypes.Jwk `json:"privateKey,omitempty" protobuf:"bytes,5,opt,name=private_key"`
}

// ValidateCommonName validates the common name of the issuer
func (i *Issuer) ValidateCommonName() error {
	if i.CommonName == "" {
		return fmt.Errorf("common name is empty")
	}

	// Validate FQDA
	_, fqdaErr := mail.ParseAddress(i.CommonName)

	// Validate FQDN
	_, fqdnErr := mail.ParseAddress("test@" + i.CommonName)

	if fqdaErr != nil && fqdnErr != nil {
		return fmt.Errorf("common name is not a valid FQDA or FQDN: %s", i.CommonName)
	}

	return nil
}
