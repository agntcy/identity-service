// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"
	"errors"
	"time"

	freecache "github.com/coocood/freecache"
	"github.com/eko/gocache/lib/v4/cache"
	"github.com/eko/gocache/lib/v4/store"
	freecache_store "github.com/eko/gocache/store/freecache/v4"
	jwtverifier "github.com/okta/okta-jwt-verifier-golang"
	"github.com/outshift/identity-service/internal/core/iam/types"
)

const (
	standaloneDefaultAud = "api://default"

	standaloneApiKeyV1ExpirationTime = 30 // 30 seconds
	standaloneDefaultApiKeyCacheSize = 1024 * 1024 * 10
)

type StandaloneClient struct {
	userJwtVerifier *jwtverifier.JwtVerifier
	apiKeyV1Cache   *cache.Cache[[]byte]
}

func NewStandaloneClient(
	issuer, userCid *string,
) *StandaloneClient {
	// Init verifier for UI
	toValidateForUser := map[string]string{}

	// Add cid from UI
	toValidateForUser["aud"] = standaloneDefaultAud
	toValidateForUser["cid"] = *userCid

	userJwtVerifierSetup := jwtverifier.JwtVerifier{
		Issuer:           *issuer,
		ClaimsToValidate: toValidateForUser,
	}

	userJwtVerifier := userJwtVerifierSetup.New()

	// Add cache for V1
	freecacheStore := freecache_store.NewFreecache(
		freecache.NewCache(standaloneDefaultApiKeyCacheSize),
		store.WithExpiration(standaloneApiKeyV1ExpirationTime*time.Second),
	)
	apiKeyV1Cache := cache.New[[]byte](freecacheStore)

	return &StandaloneClient{
		userJwtVerifier,
		apiKeyV1Cache,
	}
}

func (c *StandaloneClient) GetTenantAPIKey(
	ctx context.Context) (apiKey *types.APIKey, err error) {
	return nil, errors.New("standalone mode is not implemented")
}

func (c *StandaloneClient) CreateTenantAPIKey(
	ctx context.Context,
) (apiKey *types.APIKey, err error) {
	return nil, errors.New("standalone mode is not implemented")
}

func (c *StandaloneClient) RevokeTenantAPIKey(
	ctx context.Context) (err error) {
	return errors.New("standalone mode is not implemented")
}
func (c *StandaloneClient) GetAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	return nil, errors.New("standalone mode is not implemented")
}

func (c *StandaloneClient) CreateAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	return nil, errors.New("standalone mode is not implemented")
}

func (c *StandaloneClient) RefreshAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	return nil, errors.New("standalone mode is not implemented")
}

func (c *StandaloneClient) RevokeAppAPIKey(ctx context.Context,
	appID string) (err error) {
	return errors.New("standalone mode is not implemented")
}

func (c *StandaloneClient) AuthJwt(
	ctx context.Context,
	header string) (newCtx context.Context, err error) {
	return nil, errors.New("standalone mode is not implemented")
}

func (c *StandaloneClient) AuthAPIKey(
	ctx context.Context,
	apiKey string,
	forApp bool,
) (newCtx context.Context, err error) {
	return nil, errors.New("standalone mode is not implemented")
}
