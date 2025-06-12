// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package oidc

import (
	"context"
	"time"

	identitycache "github.com/agntcy/identity-platform/internal/pkg/cache"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/httputil"
	"github.com/agntcy/identity-platform/pkg/log"
	freecache "github.com/coocood/freecache"
	"github.com/eko/gocache/lib/v4/cache"
	"github.com/eko/gocache/lib/v4/store"
	freecache_store "github.com/eko/gocache/store/freecache/v4"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jws"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

type Claims struct {
	Issuer  string `json:"iss"`
	Subject string `json:"sub"`
}

func (c *Claims) GetCommonName() string {
	if c == nil {
		return ""
	}

	return c.Issuer
}

type ProviderName int

const (
	UnknownProviderName ProviderName = iota
	OktaProviderName
	DuoProviderName
	SelfProviderName
)

type ParsedJWT struct {
	Claims           *Claims
	Provider         ProviderName
	CommonName       string
	Verified         bool
	providerMetadata *providerMetadata
	jwtString        *string
}

type providerMetadata struct {
	Issuer   string `json:"issuer"`
	TokenURL string `json:"token_endpoint"`
	JWKSURL  string `json:"jwks_uri"`
}

const defaultCacheSize = 10 * 1024 * 1024     // 10MB
const defaultCacheExpiration = 24             // 24 hours
const defaultAcceptableSkew = 5 * time.Second // 5 seconds

type CachedJwks struct {
	Jwks string
}

// The Parser defines different methods for the PARSER standard
type Parser interface {
	// VerifyJwt verifies the provided JWT signature
	// It will attempt to retrieve the JWKS from the issuer's metadata
	// If the metadata is not available, it will use the JWKS provided in the jwksString
	// In that case, the provider will be set to SelfProviderName
	VerifyJwt(ctx context.Context, jwt *ParsedJWT, jwksString *string) error

	// Get the parsed JWT including the issuer, the subject claims
	// the common name and the provider metadata
	ParseJwt(ctx context.Context, jwtString *string) *ParsedJWT

	// Combines the ParseJwt and VerifyJwt methods
	// It will parse the JWT and then verify its signature using the JWKS
	ParseAndVerifyJwt(
		ctx context.Context,
		jwtString *string,
		jwksString *string,
	) (*ParsedJWT, error)
}

// The parser struct implements the Parser interface
type parser struct {
	jwksCache *cache.Cache[[]byte]
}

// NewParser creates a new instance of the Parser
func NewParser() Parser {
	jwksCache := cache.New[[]byte](
		freecache_store.NewFreecache(
			freecache.NewCache(defaultCacheSize),
			store.WithExpiration(defaultCacheExpiration*time.Second),
		))

	return &parser{
		jwksCache,
	}
}

func (p *parser) ParseAndVerifyJwt(
	ctx context.Context,
	jwtString *string,
	jwksString *string,
) (*ParsedJWT, error) {
	// Parse the JWT
	parsedJwt := p.ParseJwt(ctx, jwtString)

	// If the JWT could not be parsed, return an Error
	if parsedJwt == nil {
		return nil, errutil.Err(nil, "failed to parse JWT")
	}

	// Verify the JWT
	err := p.VerifyJwt(ctx, parsedJwt, jwksString)
	if err != nil {
		return nil, errutil.Err(err, "failed to verify JWT")
	}

	return parsedJwt, nil
}

func (p *parser) VerifyJwt(
	ctx context.Context,
	parsedJwt *ParsedJWT,
	jwksString *string,
) error {
	if parsedJwt == nil {
		return errutil.Err(
			nil,
			"the jwt provided is nil or was parsed incorrectly",
		)
	}

	var err error
	var jwks jwk.Set

	if parsedJwt.Provider != SelfProviderName {
		// Get the JWKS from the issuer
		jwks, err = p.getJwks(ctx, parsedJwt.providerMetadata)
		if err != nil {
			return errutil.Err(err, "failed to get JWKS from issuer")
		}
	} else {
		log.Debug("Using issuer's self generated JWKS")

		// We will use issuer's self generated JWKS
		jwks, err = p.parseJwks(jwksString)
		if err != nil {
			return errutil.Err(err, "failed to parse JWKS")
		}
	}

	// Verify the JWT signature
	_, err = jws.Verify([]byte(*parsedJwt.jwtString), jws.WithKeySet(jwks))
	if err != nil {
		return err
	}

	return nil
}

func (p *parser) ParseJwt(
	ctx context.Context,
	jwtString *string,
) *ParsedJWT {
	// Check if the JWT string is empty
	if jwtString == nil || *jwtString == "" {
		return nil
	}

	claims, err := p.GetClaims(ctx, jwtString)
	if err != nil {
		return nil
	}

	log.Debug("Validating JWT for issuer:", claims.Issuer, " and subject:", claims.Subject)

	providerName := SelfProviderName

	// Get the provider metadata from the issuer
	providerMetadata, err := p.getProviderMetadata(ctx, claims.Issuer)
	if err == nil {
		providerName, err = p.detectProviderName(ctx, providerMetadata)
		if err != nil {
			return nil
		}
	}

	// Get common name from the JWT claims
	commonName := claims.Issuer
	if providerName != SelfProviderName {
		commonName = httputil.Hostname(claims.Issuer)
	}

	return &ParsedJWT{
		Claims:           claims,
		Provider:         providerName,
		CommonName:       commonName,
		Verified:         providerName != SelfProviderName,
		providerMetadata: providerMetadata,
		jwtString:        jwtString,
	}
}

func (p *parser) GetClaims(
	ctx context.Context,
	jwtString *string,
) (*Claims, error) {
	// Parse the JWT string
	jwtToken, err := jwt.Parse(
		[]byte(*jwtString),
		jwt.WithVerify(false),
		jwt.WithValidate(true),
		jwt.WithAcceptableSkew(defaultAcceptableSkew),
	)
	if err != nil {
		return nil, errutil.Err(err, "failed to parse JWT")
	}

	// Get issuer from the JWT string
	issuer, ok := jwtToken.Issuer()
	if !ok {
		return nil, errutil.Err(nil, "failed to decode JWT: missing 'iss' claim")
	}

	// Get subject from the JWT string
	subject, ok := jwtToken.Subject()
	if !ok {
		return nil, errutil.Err(nil, "failed to decode JWT: missing 'sub' claim")
	}

	return &Claims{
		Issuer:  issuer,
		Subject: subject,
	}, nil
}

func (p *parser) getWellKnownURL(issuer string) string {
	return issuer + "/.well-known/openid-configuration"
}

func (p *parser) getProviderMetadata(
	ctx context.Context,
	issuer string,
) (*providerMetadata, error) {
	// Get the raw data from the issuer
	var metadata providerMetadata

	// Get the well-known URL from the issuer
	wellKnownURL := p.getWellKnownURL(issuer)
	log.Debug("Getting metadata from issuer:", issuer, " with URL:", wellKnownURL)

	// Get the metadata from the issuer
	err := httputil.GetJSON(ctx, wellKnownURL, &metadata)
	if err != nil {
		return nil, errutil.Err(err, "failed to get metadata from issuer")
	}

	log.Debug("Got metadata from issuer:", metadata)

	return &metadata, nil
}

func (p *parser) getJwks(ctx context.Context, provider *providerMetadata) (jwk.Set, error) {
	// Try to get the cached JWKS
	cachedEntry, found := identitycache.GetFromCache[CachedJwks](ctx, p.jwksCache, provider.Issuer)
	if found {
		return p.parseJwks(&cachedEntry.Jwks)
	}

	// Get the raw data from the JWKS URI
	var jwksString string

	// Get the JWKs
	err := httputil.GetWithRawBody(ctx, provider.JWKSURL, nil, &jwksString)
	if err != nil {
		return nil, errutil.Err(err, "failed to get JWKS from issuer")
	}

	jwks, err := p.parseJwks(&jwksString)
	if err != nil {
		return nil, errutil.Err(err, "failed to parse JWKS")
	}

	// Cache the JWKS
	err = identitycache.AddToCache(ctx, p.jwksCache, provider.Issuer, &CachedJwks{Jwks: jwksString})
	if err != nil {
		log.Warn(err)
	}

	return jwks, nil
}

func (p *parser) parseJwks(jwksString *string) (jwk.Set, error) {
	if jwksString == nil || *jwksString == "" {
		return nil, errutil.Err(nil, "JWKS string is empty")
	}

	jwks, err := jwk.Parse([]byte(*jwksString))
	if err != nil {
		return nil, errutil.Err(err, "failed to parse JWKS")
	}

	return jwks, nil
}
