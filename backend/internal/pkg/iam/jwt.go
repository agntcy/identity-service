// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
	jwtverifier "github.com/okta/okta-jwt-verifier-golang"
)

type Claims map[string]interface{}

type ClaimConfig struct {
	TenantClaimName string
	UserClaimName   string
	OrgClaimName    string
}

type JwtVerifier interface {
	VerifyAccessToken(jwt string) (Claims, error)
	GetClaimConfig() ClaimConfig
}

type oktaJwtVerifier struct {
	userJwtVerifier *jwtverifier.JwtVerifier
}

func NewOktaJwtVerifier(issuer, userCid, userCidClaimName string) JwtVerifier {
	// Init verifier for UI
	toValidateForUser := map[string]string{}

	// Add cid from UI
	toValidateForUser["aud"] = standaloneDefaultAud
	toValidateForUser[userCidClaimName] = userCid

	userJwtVerifierSetup := jwtverifier.JwtVerifier{
		Issuer:           issuer,
		ClaimsToValidate: toValidateForUser,
	}

	userJwtVerifier := userJwtVerifierSetup.New()

	return &oktaJwtVerifier{
		userJwtVerifier: userJwtVerifier,
	}
}

func (v *oktaJwtVerifier) VerifyAccessToken(jwt string) (Claims, error) {
	token, err := v.userJwtVerifier.VerifyAccessToken(jwt)
	if err != nil {
		return nil, err
	}

	return token.Claims, nil
}

func (v *oktaJwtVerifier) GetClaimConfig() ClaimConfig {
	// Okta uses standard claim names - provide sensible defaults
	return ClaimConfig{
		TenantClaimName: "tenant_id",          // Fallback to hardcoded for backward compatibility
		UserClaimName:   "preferred_username", // Fallback to hardcoded for backward compatibility
		OrgClaimName:    "organization",       // Fallback to hardcoded for backward compatibility
	}
}

// Keycloak JWT Verifier

type keycloakJwtVerifier struct {
	issuer          string
	audience        string
	clientID        string
	realm           string
	keySet          jwk.Set
	multiTenant     bool
	tenantClaimName string
	userClaimName   string
	orgClaimName    string
}

func NewKeycloakJwtVerifier(issuer, audience, clientID, realm string) JwtVerifier {
	return &keycloakJwtVerifier{
		issuer:   issuer,
		audience: audience,
		clientID: clientID,
		realm:    realm,
	}
}

func NewKeycloakMultiTenantJwtVerifier(issuer, audience, clientID, realm, tenantClaimName, userClaimName, orgClaimName string) JwtVerifier {
	return &keycloakJwtVerifier{
		issuer:          issuer,
		audience:        audience,
		clientID:        clientID,
		realm:           realm,
		multiTenant:     true,
		tenantClaimName: tenantClaimName,
		userClaimName:   userClaimName,
		orgClaimName:    orgClaimName,
	}
}

func (v *keycloakJwtVerifier) VerifyAccessToken(tokenString string) (Claims, error) {
	ctx := context.Background()

	fmt.Printf("DEBUG: Starting JWT verification for token: %s...\n", tokenString[:min(50, len(tokenString))])
	fmt.Printf("DEBUG: Expected issuer: %s\n", v.issuer)
	fmt.Printf("DEBUG: Expected audience: %s\n", v.audience)

	// Fetch JWK Set if not cached
	if v.keySet == nil {
		fmt.Printf("DEBUG: JWK set not cached, fetching...\n")
		err := v.fetchJWKSet(ctx)
		if err != nil {
			fmt.Printf("DEBUG: Failed to fetch JWK set: %v\n", err)
			return nil, fmt.Errorf("failed to fetch JWK set: %w", err)
		}
	}

	// Parse and verify the token
	fmt.Printf("DEBUG: Parsing JWT token...\n")
	token, err := jwt.Parse([]byte(tokenString), jwt.WithKeySet(v.keySet), jwt.WithValidate(true))
	if err != nil {
		fmt.Printf("DEBUG: Failed to parse/verify token: %v\n", err)
		return nil, fmt.Errorf("failed to parse/verify token: %w", err)
	}

	// Validate issuer
	issuer, ok := token.Issuer()
	fmt.Printf("DEBUG: Token issuer: %s (valid: %t)\n", issuer, ok)
	if !ok || issuer != v.issuer {
		fmt.Printf("DEBUG: Issuer validation failed: expected %s, got %s\n", v.issuer, issuer)
		return nil, fmt.Errorf("invalid issuer: expected %s, got %s", v.issuer, issuer)
	}

	// Validate audience if specified
	if v.audience != "" {
		audiences, ok := token.Audience()
		fmt.Printf("DEBUG: Token audiences: %v (valid: %t)\n", audiences, ok)
		if !ok {
			fmt.Printf("DEBUG: Token missing audience claim\n")
			return nil, fmt.Errorf("token missing audience claim")
		}
		found := false
		for _, aud := range audiences {
			if aud == v.audience {
				found = true
				break
			}
		}
		if !found {
			fmt.Printf("DEBUG: Audience validation failed: expected %s, got %v\n", v.audience, audiences)
			return nil, fmt.Errorf("invalid audience: expected %s, got %v", v.audience, audiences)
		}
		fmt.Printf("DEBUG: Audience validation passed\n")
	}

	// Validate expiration
	expiration, ok := token.Expiration()
	if !ok {
		return nil, fmt.Errorf("token missing expiration claim")
	}
	if expiration.Before(time.Now()) {
		return nil, fmt.Errorf("token has expired")
	}

	// Convert to Claims
	result := make(Claims)

	// Get common claims
	if sub, ok := token.Subject(); ok {
		result["sub"] = sub
	}
	if aud, ok := token.Audience(); ok {
		result["aud"] = aud
	}
	if iss, ok := token.Issuer(); ok {
		result["iss"] = iss
	}
	if exp, ok := token.Expiration(); ok {
		result["exp"] = exp.Unix()
	}
	if iat, ok := token.IssuedAt(); ok {
		result["iat"] = iat.Unix()
	}

	// Extract multi-tenant specific claims if configured
	if v.multiTenant {
		// Extract tenant claim
		if v.tenantClaimName != "" {
			var tenantValue interface{}
			if err := token.Get(v.tenantClaimName, &tenantValue); err == nil {
				result[v.tenantClaimName] = tenantValue
			}
		}

		// Extract user claim
		if v.userClaimName != "" {
			var userValue interface{}
			if err := token.Get(v.userClaimName, &userValue); err == nil {
				result[v.userClaimName] = userValue
			}
		}

		// Extract organization claim
		if v.orgClaimName != "" {
			var orgValue interface{}
			if err := token.Get(v.orgClaimName, &orgValue); err == nil {
				result[v.orgClaimName] = orgValue
			}
		}

		// Extract common Keycloak multi-tenant claims
		commonClaims := []string{
			"realm_access", "resource_access", "scope", "client_id",
			"preferred_username", "name", "given_name", "family_name",
			"email", "email_verified", "groups", "roles",
		}

		for _, claim := range commonClaims {
			var value interface{}
			if err := token.Get(claim, &value); err == nil {
				result[claim] = value
			}
		}
	}

	return result, nil
}

func (v *keycloakJwtVerifier) fetchJWKSet(ctx context.Context) error {
	// The issuer already includes the realm path, so we need to construct the JWKS URL correctly
	// If issuer is "http://localhost:8080/realms/master", we should use it as base
	var jwksURL string
	if strings.Contains(v.issuer, "/realms/") {
		// Issuer already contains the realm path
		jwksURL = fmt.Sprintf("%s/protocol/openid-connect/certs", v.issuer)
	} else {
		// Issuer is just the base URL
		jwksURL = fmt.Sprintf("%s/realms/%s/protocol/openid-connect/certs", v.issuer, v.realm)
	}

	// For development: translate localhost to host.docker.internal for JWKS fetch
	// This allows the app running on host to fetch JWKS from Keycloak in Docker
	// while still validating tokens with localhost issuer
	jwksURL = strings.Replace(jwksURL, "localhost:8080", "host.docker.internal:8080", 1)

	fmt.Printf("DEBUG: Fetching JWKS from URL: %s\n", jwksURL)
	keySet, err := jwk.Fetch(ctx, jwksURL)
	if err != nil {
		fmt.Printf("DEBUG: Failed to fetch JWKS: %v\n", err)
		return fmt.Errorf("failed to fetch JWK set from %s: %w", jwksURL, err)
	}

	fmt.Printf("DEBUG: Successfully fetched JWKS with %d keys\n", keySet.Len())
	v.keySet = keySet
	return nil
}

func (v *keycloakJwtVerifier) GetClaimConfig() ClaimConfig {
	if v.multiTenant {
		// Use configured claim names for multi-tenant setup
		return ClaimConfig{
			TenantClaimName: v.tenantClaimName,
			UserClaimName:   v.userClaimName,
			OrgClaimName:    v.orgClaimName,
		}
	}

	// Use sensible defaults for single-tenant setup
	return ClaimConfig{
		TenantClaimName: "tenant_id",
		UserClaimName:   "preferred_username",
		OrgClaimName:    "organization",
	}
}
