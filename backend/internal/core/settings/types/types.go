// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// Type
type IdpType int

const (
	// Unspecified Envelope Type.
	IDP_TYPE_UNSPECIFIED IdpType = iota

	// Idp Type Duo.
	IDP_TYPE_DUO

	// Idp Type Okta.
	IDP_TYPE_OKTA

	// Idp Type Self.
	IDP_TYPE_SELF
)

func (t *IdpType) UnmarshalText(text []byte) error {
	switch string(text) {
	case IDP_TYPE_DUO.String():
		*t = IDP_TYPE_DUO
	case IDP_TYPE_OKTA.String():
		*t = IDP_TYPE_OKTA
	default:
		*t = IDP_TYPE_UNSPECIFIED
	}

	return nil
}

func (t IdpType) MarshalText() ([]byte, error) {
	return []byte(t.String()), nil
}

// An Identity API Key.
type ApiKey struct {
	ApiKey string `json:"api_key,omitempty" protobuf:"bytes,1,opt,name=api_key"`
}

// Okta IdP Settings
type OktaIdpSettings struct {
	OrgUrl     string `json:"org_url,omitempty"     protobuf:"bytes,1,opt,name=org_url"`
	ClientID   string `json:"client_id,omitempty"   protobuf:"bytes,2,opt,name=client_id"`
	PrivateKey string `json:"private_key,omitempty" protobuf:"bytes,3,opt,name=private_key"`
}

// Duo IdP Settings
type DuoIdpSettings struct {
	Hostname       string `json:"hostname,omitempty"        protobuf:"bytes,1,opt,name=hostname"`
	IntegrationKey string `json:"integration_key,omitempty" protobuf:"bytes,2,opt,name=integration_key"`
	SecretKey      string `json:"secret_key,omitempty"      protobuf:"bytes,3,opt,name=secret_key "`
}

// Issuer Settings
type IssuerSettings struct {
	// A unique identifier for the Issuer.
	// This is typically the Issuer's ID in the Identity.
	IssuerID string `json:"issuer_id,omitempty" protobuf:"bytes,1,opt,name=issuer_id"`

	// A unique identifier for the Key.
	// This is typically the Key's ID in the vault provider.
	KeyID string `json:"key_id,omitempty" protobuf:"bytes,2,opt,name=key_id"`

	// The type of the IdP.
	IdpType IdpType `json:"idp_type,omitempty" protobuf:"bytes,3,opt,name=idp_type"`

	// Settings for the Duo Identity Provider.
	DuoIdpSettings *DuoIdpSettings `json:"duo_idp_settings,omitempty" protobuf:"bytes,4,opt,name=duo_idp_settings"`

	// Settings for the Okta Identity Provider.
	OktaIdpSettings *OktaIdpSettings `json:"okta_idp_settings,omitempty" protobuf:"bytes,5,opt,name=okta_idp_settings"`
}

// Identity Settings
type Settings struct {
	// An API Key for the Identity Platform.
	ApiKey *ApiKey `json:"api_key,omitempty" protobuf:"bytes,1,opt,name=api_key"`

	// Settings for the Issuer.
	IssuerSettings *IssuerSettings `json:"issuer_settings,omitempty" protobuf:"bytes,2,opt,name=issuer_settings"`
}
