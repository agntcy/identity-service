// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	iamcore "github.com/agntcy/identity-service/internal/core/iam"
	"github.com/agntcy/identity-service/internal/core/iam/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/internal/pkg/strutil"
	freecache "github.com/coocood/freecache"
	"github.com/eko/gocache/lib/v4/cache"
	"github.com/eko/gocache/lib/v4/store"
	freecache_store "github.com/eko/gocache/store/freecache/v4"
	"github.com/google/uuid"
)

const (
	standaloneDefaultAud       = "api://default"
	standaloneUsernameClaimKey = "sub"

	standaloneApiKeyV1ExpirationTime = 30 // 30 seconds
	standaloneDefaultApiKeyCacheSize = 1024 * 1024 * 10

	standaloneApiKeyName            = "default"
	standaloneApiKeyLength          = 32
	standaloneTokenComponentsLength = 1
	standaloneBearerPrefix          = "Bearer "

	standaloneTenantID = "default"
)

type StandaloneClient struct {
	iamRepository   iamcore.Repository
	userJwtVerifier JwtVerifier
	apiKeyV1Cache   *cache.Cache[[]byte]
	organization    string
}

func NewStandaloneClient(
	organization string,
	iamRepository iamcore.Repository,
	jwtVerifier JwtVerifier,
) *StandaloneClient {
	// Add cache for V1
	freecacheStore := freecache_store.NewFreecache(
		freecache.NewCache(standaloneDefaultApiKeyCacheSize),
		store.WithExpiration(standaloneApiKeyV1ExpirationTime*time.Second),
	)
	apiKeyV1Cache := cache.New[[]byte](freecacheStore)

	return &StandaloneClient{
		iamRepository,
		jwtVerifier,
		apiKeyV1Cache,
		organization,
	}
}

func (c *StandaloneClient) GetTenantAPIKey(
	ctx context.Context,
) (*types.APIKey, error) {
	return c.iamRepository.GetAPIKeyByTenant(ctx)
}

func (c *StandaloneClient) CreateTenantAPIKey(
	ctx context.Context,
) (*types.APIKey, error) {
	return c.iamRepository.AddAPIKey(ctx, &types.APIKey{
		ID:     uuid.NewString(),
		Name:   standaloneApiKeyName,
		Secret: ptrutil.Ptr(strutil.Random(standaloneApiKeyLength)),
	})
}

func (c *StandaloneClient) RevokeTenantAPIKey(
	ctx context.Context,
) error {
	apiKey, err := c.iamRepository.GetAPIKeyByTenant(ctx)
	if err != nil {
		return err
	}

	err = c.iamRepository.DeleteAPIKey(ctx, apiKey)
	if err != nil {
		return fmt.Errorf("there was an error revoking the APIKey: %w", err)
	}

	return nil
}

func (c *StandaloneClient) GetAppAPIKey(
	ctx context.Context,
	appID string,
) (*types.APIKey, error) {
	return c.iamRepository.GetAPIKeyByApp(ctx, appID)
}

func (c *StandaloneClient) CreateAppAPIKey(
	ctx context.Context,
	appID string,
) (*types.APIKey, error) {
	return c.iamRepository.AddAPIKey(ctx, &types.APIKey{
		ID:     uuid.NewString(),
		Name:   fmt.Sprintf("%s-%s", standaloneApiKeyName, appID),
		AppID:  ptrutil.Ptr(appID),
		Secret: ptrutil.Ptr(strutil.Random(standaloneApiKeyLength)),
	})
}

func (c *StandaloneClient) RefreshAppAPIKey(
	ctx context.Context,
	appID string,
) (*types.APIKey, error) {
	err := c.RevokeAppAPIKey(ctx, appID)
	if err != nil {
		return nil, err
	}

	return c.CreateAppAPIKey(ctx, appID)
}

func (c *StandaloneClient) RevokeAppAPIKey(
	ctx context.Context,
	appID string,
) error {
	apiKey, err := c.iamRepository.GetAPIKeyByApp(ctx, appID)
	if err != nil {
		return err
	}

	err = c.iamRepository.DeleteAPIKey(ctx, apiKey)
	if err != nil {
		return fmt.Errorf("there was an error revoking the APIKey: %w", err)
	}

	return nil
}

func (c *StandaloneClient) AuthJwt(
	ctx context.Context,
	header string,
) (context.Context, error) {
	if header == "" {
		return ctx, errors.New("authorization header is required")
	}

	accessToken, err := c.getTokenFromBearer(header)
	if err != nil {
		return ctx, errors.New("invalid Authorization header format")
	}

	username, validateErr := c.validateAccessToken(accessToken)
	if validateErr != nil {
		return ctx, fmt.Errorf("there was an error validating the access token: %w", validateErr)
	}

	ctx = identitycontext.InsertTenantID(ctx, standaloneTenantID)

	// Add username if present
	if username != nil {
		ctx = identitycontext.InsertUserID(ctx, *username)
	}

	// Add organization
	if c.organization != "" {
		ctx = identitycontext.InsertOrganizationID(ctx, c.organization)
	}

	return ctx, nil
}

func (c *StandaloneClient) getTokenFromBearer(header string) (string, error) {
	splitToken := strutil.TrimSlice(strings.Split(header, standaloneBearerPrefix))
	if !strings.HasPrefix(header, standaloneBearerPrefix) ||
		len(splitToken) < standaloneTokenComponentsLength {
		return "", errors.New("invalid Authorization header format")
	}

	return splitToken[0], nil
}

func (c *StandaloneClient) AuthAPIKey(
	ctx context.Context,
	apiKey string,
	forApp bool,
) (context.Context, error) {
	// Insert tenant ID into context
	ctx = identitycontext.InsertTenantID(ctx, standaloneTenantID)

	aKey, err := c.iamRepository.GetAPIKeyBySecret(ctx, apiKey)
	if err != nil {
		return ctx, fmt.Errorf("there was an error fetching the APIKey: %w", err)
	}

	// Verify that the API key is for a tenant
	if !forApp && (aKey.AppID != nil && *aKey.AppID != "") {
		return ctx, errors.New("the provided APIKey is not for a tenant")
	}

	// Verify that the API key is for an app if required
	if forApp {
		if aKey.AppID == nil || *aKey.AppID == "" {
			return ctx, errors.New("the provided APIKey is not for an app")
		}

		// Insert app ID into context
		ctx = identitycontext.InsertAppID(ctx, *aKey.AppID)
	}

	return ctx, nil
}

func (c *StandaloneClient) validateAccessToken(
	accessToken string,
) (*string, error) {
	claims, err := c.userJwtVerifier.VerifyAccessToken(accessToken)
	if err != nil {
		return nil, fmt.Errorf("there was an error verifying the access token: %w", err)
	}

	var username *string
	if usernameRaw, ok := claims[standaloneUsernameClaimKey].(string); ok {
		username = &usernameRaw
	}

	return username, nil
}
