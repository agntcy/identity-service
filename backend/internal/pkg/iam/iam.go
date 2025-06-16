// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package outshiftiam

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	identitycache "github.com/agntcy/identity-platform/internal/pkg/cache"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/httputil"
	"github.com/agntcy/identity-platform/pkg/log"
	freecache "github.com/coocood/freecache"
	"github.com/eko/gocache/lib/v4/cache"
	"github.com/eko/gocache/lib/v4/store"
	freecache_store "github.com/eko/gocache/store/freecache/v4"
	jwtverifier "github.com/okta/okta-jwt-verifier-golang"
)

// ------------------------ GLOBAL -------------------- //

const tokenLength = 2 // Bearer <token> => 2 parts
const identityAppLabel = "Identity-App-"
const identityTenantLabel = "Identity-Tenant-"

var singleTenantAppID = "00000000-0000-0000-000000000000"

type IdentityTags struct {
	AppID string `json:"appId,omitempty"`
}

type APIKey struct {
	ID       string       `json:"id,omitempty"`
	Name     string       `json:"name,omitempty"`
	Secret   string       `json:"secret,omitempty"`
	TenantID string       `json:"tenantId,omitempty"`
	Tags     IdentityTags `json:"tags,omitempty"`
}

type APIKeyList struct {
	APIKeys []APIKey `json:"apiKeys,omitempty"`
}

// API Key V1 Cache
const defaultAPIKeyV1ExpirationTime = 60        // In seconds
const defaultAPIKeyCacheSize = 10 * 1024 * 1024 // 10MB

type apiKeyV1Cache struct {
	IdentityTags *IdentityTags
	Tenant       *string
}

// Header keys
const (
	SessionAccessTokenKey   string = "Authorization"
	TenantClaimKey          string = "tenant"
	UsernameClaimKey        string = "sub"
	APIKeyKey               string = "x-id-api-key"     //nolint:gosec // This is a false positive
	APIKeyTenantKey         string = "x-api-key-tenant" //nolint:gosec // This is a false positive
	APIKeyTagsKey           string = "x-api-key-tags"   //nolint:gosec // This is a false positive
	SessionAPIKeyProductKey string = "x-id-product"     //nolint:gosec // This is a false positive
	APIKeyAdminProductKey   string = "x-auth-token"     //nolint:gosec // This is a false positive
	AuthTypeJWTToken        string = "jwt-token"
	AuthTypeAPIKey          string = "api-key"
)

// IAM Endpoints
const IAMExtAuthEndpoint = "/ext-auth"
const IAMAPIKeyEndpoint = "/admin/tenant/%s/api-key" //nolint:gosec // This is a false positive
const IAMCreateAPIKeyEndpoint = "/api-key"
const IAMTenantEndpoint = "/tenant"

const defaultIAMAud = "api://default"

type IAM interface {
	AuthJwt(
		ctx context.Context,
		header string,
	) (newCtx context.Context, err error)
	AuthAPIKey(
		ctx context.Context,
		productID string,
		apiKey string,
		forApp bool,
	) (newCtx context.Context, err error)
	GetTenantAPIKey(ctx context.Context) (apiKey APIKey, err error)
	CreateTenantAPIKey(ctx context.Context) (apiKey APIKey, err error)
	CreateAppAPIKey(ctx context.Context, appID string) (apiKey APIKey, err error)
	RevokeTenantAPIKey(ctx context.Context) (err error)
	RevokeAppAPIKey(ctx context.Context, appID string) (err error)
}

type Client struct {
	httpClient          *http.Client
	url                 string
	adminApiKey         string
	multitenant         bool
	singleTenantID      string
	userJwtVerifier     *jwtverifier.JwtVerifier
	apiKeyV2JwtVerifier *jwtverifier.JwtVerifier
	apiKeyV1Cache       *cache.Cache[[]byte]
}

func NewClient(
	httpClient *http.Client,
	url string,
	adminApiKey string,
	multitenant bool,
	singleTenantID string,
	issuer, userCid, apiKeyCid *string,
) *Client {
	// Init verifier for UI and API Keys
	toValidateForUser := map[string]string{}
	toValidateForAPIKey := map[string]string{}

	// Add both cid from UI or APIKeys
	toValidateForUser["aud"] = defaultIAMAud
	toValidateForUser["cid"] = *userCid
	toValidateForAPIKey["aud"] = defaultIAMAud
	toValidateForAPIKey["cid"] = *apiKeyCid

	userJwtVerifierSetup := jwtverifier.JwtVerifier{
		Issuer:           *issuer,
		ClaimsToValidate: toValidateForUser,
	}
	apiKeyJwtVerifierSetup := jwtverifier.JwtVerifier{
		Issuer:           *issuer,
		ClaimsToValidate: toValidateForAPIKey,
	}

	userJwtVerifier := userJwtVerifierSetup.New()
	apiKeyV2JwtVerifier := apiKeyJwtVerifierSetup.New()

	// Add cache for V1
	freecacheStore := freecache_store.NewFreecache(
		freecache.NewCache(defaultAPIKeyCacheSize),
		store.WithExpiration(defaultAPIKeyV1ExpirationTime*time.Second),
	)
	apiKeyV1Cache := cache.New[[]byte](freecacheStore)

	return &Client{
		httpClient,
		url,
		adminApiKey,
		multitenant,
		singleTenantID,
		userJwtVerifier,
		apiKeyV2JwtVerifier,
		apiKeyV1Cache,
	}
}

// ------------------------ GLOBAL -------------------- //

func (c *Client) AuthJwt(
	ctx context.Context,
	header string,
) (context.Context, error) {
	if header == "" {
		return ctx, errors.New("no header")
	}

	splitToken := strings.Split(header, "Bearer ")
	if len(splitToken) < tokenLength {
		return ctx, errors.New("no Bearer token")
	}

	accessToken := splitToken[1]

	username, tenant, validateErr := c.validateAccessToken(ctx, accessToken)
	if validateErr != nil {
		return ctx, errors.New("JWT validation failed")
	}

	ctx = identitycontext.InsertTenantID(ctx, *tenant)
	log.Debug("Validated JWT for tenant ", *tenant)

	// Add username if present
	if username != nil {
		ctx = identitycontext.InsertUserID(ctx, *username)
	}
	ctx = identitycontext.InsertAuthType(ctx, AuthTypeJWTToken)

	return ctx, nil
}

func (c *Client) AuthAPIKey(
	ctx context.Context,
	productID string,
	apiKey string,
	forApp bool,
) (context.Context, error) {
	if apiKey == "" {
		return ctx, errors.New("no API Key")
	}

	tenant, tags := c.validateAPIKeyV1(ctx, productID, apiKey)
	if tenant == nil {
		return ctx, errors.New("API Key validation failed")
	}

	ctx = identitycontext.InsertTenantID(ctx, *tenant)
	ctx = identitycontext.InsertAuthType(ctx, AuthTypeAPIKey)

	if !c.multitenant {
		ctx = identitycontext.InsertAppID(ctx, singleTenantAppID)

		return ctx, nil
	}

	if !forApp && tags.AppID != "" {
		// This is a app id
		return ctx, errors.New("API Key validation failed")
	}

	// Insert appID
	ctx = identitycontext.InsertAppID(ctx, tags.AppID)

	return ctx, nil
}

// GetTenantAPIKey returns the API Key for the tenant. If no API Key exists, an empty API Key is returned.
func (c *Client) GetTenantAPIKey(ctx context.Context) (APIKey, error) {
	var apiKey APIKey

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return apiKey, errors.New("missing TenantID in context")
	}

	if !c.multitenant {
		apiKey.Name = identityTenantLabel + c.singleTenantID
		apiKey.Tags.AppID = singleTenantAppID
		apiKey.Secret = c.adminApiKey

		return apiKey, nil
	}

	apiKey, err := c.getAPIKeyByTenant(ctx, tenantID)
	if err != nil {
		return apiKey, err
	}

	log.Debug("Returning API Key ", apiKey.ID)

	return apiKey, nil
}

// CreateTenantAPIKey creates an API Key for a tenant. The API Key is unique per tenant.
func (c *Client) CreateTenantAPIKey(ctx context.Context) (APIKey, error) {
	var apiKey APIKey

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return apiKey, errors.New("missing TenantID in context")
	}

	log.Debug(
		fmt.Sprintf(
			"Creating API Key for tenant: %s)",
			tenantID,
		),
	)

	if !c.multitenant {
		return c.GetTenantAPIKey(ctx)
	}

	apiKey.Name = identityTenantLabel + tenantID

	log.Debug("Creating API Key ", apiKey.ID)

	createErr := c.createAPIKey(ctx, &apiKey)
	if createErr != nil {
		return apiKey, createErr
	}

	log.Debug("Created API Key ", apiKey.ID)

	return apiKey, nil
}

// CreateAppAPIKey creates an API Key for a app. The API Key is tagged with the appID.
func (c *Client) CreateAppAPIKey(
	ctx context.Context,
	appID string,
) (APIKey, error) {
	var apiKey APIKey

	if appID == "" {
		return apiKey, errors.New("missing appID")
	}

	if !c.multitenant {
		return c.GetTenantAPIKey(ctx)
	}

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return apiKey, errors.New("missing TenantID in context")
	}

	log.Debug(
		fmt.Sprintf(
			"Creating API Key for app %s (tenant: %s)",
			appID,
			tenantID,
		),
	)

	apiKey.Name = identityAppLabel + appID
	apiKey.Tags.AppID = appID

	log.Debug("Creating API Key ", apiKey)

	createErr := c.createAPIKey(ctx, &apiKey)
	if createErr != nil {
		return apiKey, createErr
	}

	log.Debug("Created API Key ", apiKey.ID)
	// The response does not return Tags. Insert them here
	apiKey.Tags.AppID = appID

	return apiKey, nil
}

// RevokeTenantAPIKey revokes the API Key for a tenant.
func (c *Client) RevokeTenantAPIKey(ctx context.Context) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("missing TenantID in context")
	}

	if !c.multitenant {
		return errors.New("operation not supported in single tenant mode")
	}

	apiKey, err := c.getAPIKeyByTenant(ctx, tenantID)
	if err != nil {
		log.Debug("API Key for tenant " + tenantID + "not found. Ignoring")
		return err
	}

	if apiKey == (APIKey{}) {
		log.Debug("API Key for tenant " + tenantID + "not found. Ignoring")
		return nil
	}

	return c.revokeAPIKey(ctx, &apiKey)
}

// RevokeAppAPIKey revokes the API Key for a app.
func (c *Client) RevokeAppAPIKey(ctx context.Context, appID string) error {
	if appID == "" {
		return errors.New("missing appID")
	}

	if !c.multitenant {
		return errors.New("operation not supported in single tenant mode")
	}

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("missing TenantID in context")
	}

	apiKey, err := c.getAPIKeyByApp(ctx, appID, tenantID)
	if err != nil {
		log.Debug("API Key for app " + appID + "not found. Ignoring")
		return err
	}

	if apiKey == (APIKey{}) {
		log.Debug("API Key for app " + appID + "not found. Ignoring")
		return nil
	}

	return c.revokeAPIKey(ctx, &apiKey)
}

// This method will use Okta library to validate JWTs from both User / API Key
func (c *Client) validateAccessToken(
	_ context.Context,
	accessToken string,
) (*string, *string, error) {
	var token *jwtverifier.Jwt
	var verifyErr error

	token, verifyErr = c.userJwtVerifier.VerifyAccessToken(accessToken)
	if verifyErr != nil {
		log.Debug("Got error validating user jwt, trying api key", verifyErr)

		// Try with API Key V2
		token, verifyErr = c.apiKeyV2JwtVerifier.VerifyAccessToken(accessToken)
		if verifyErr != nil {
			log.Debug("Got error validating api key", verifyErr)
			return nil, nil, verifyErr
		}
	}

	var username *string
	if usernameRaw, ok := token.Claims[UsernameClaimKey].(string); ok {
		username = &usernameRaw
	}

	var tenant *string

	if c.multitenant {
		if tenantRaw, ok := token.Claims[TenantClaimKey].(string); ok {
			tenant = &tenantRaw
		}
	} else {
		tenant = &c.singleTenantID
	}

	return username, tenant, nil
}

func (c *Client) createAPIKey(
	ctx context.Context,
	apiKey *APIKey,
) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("missing TenantID in context")
	}

	uri := c.url + fmt.Sprintf(IAMAPIKeyEndpoint, tenantID)

	body, _, err := c.apiKeyCall(ctx, http.MethodPost, uri, apiKey)
	if err != nil {
		return errors.New("could not create API Key got error" + err.Error())
	}

	err = json.Unmarshal(body, apiKey)
	if err != nil {
		return errors.New("could not create API Key")
	}

	log.Debug("Created API Key ", apiKey.ID)

	return nil
}

func (c *Client) getAPIKeyByTenant(
	ctx context.Context,
	tenantID string,
) (APIKey, error) {
	var apiKey APIKey

	uri := c.url + fmt.Sprintf(IAMAPIKeyEndpoint, tenantID)

	body, _, err := c.apiKeyCall(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return apiKey, errors.New("could not get API Key for tenant " + tenantID)
	}

	apiKeys := APIKeyList{}

	err = json.Unmarshal(body, &apiKeys)
	if err != nil {
		return apiKey, errors.New("could not get API Key for tenant " + tenantID)
	}

	for _, k := range apiKeys.APIKeys {
		if k.Tags.AppID == "" {
			apiKey = k
			break
		}
	}

	return apiKey, nil
}

func (c *Client) getAPIKeyByApp(
	ctx context.Context,
	appID string,
	tenantID string,
) (APIKey, error) {
	var apiKey APIKey

	uri := c.url + fmt.Sprintf(IAMAPIKeyEndpoint, tenantID)

	body, _, err := c.apiKeyCall(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return apiKey, errors.New("could not get API Key for app " + appID)
	}

	apiKeys := APIKeyList{}

	err = json.Unmarshal(body, &apiKeys)
	if err != nil {
		return apiKey, errors.New("could not get API Key for app " + appID)
	}

	for _, k := range apiKeys.APIKeys {
		if k.Tags.AppID == appID {
			apiKey = k
			break
		}
	}

	return apiKey, nil
}

func (c *Client) revokeAPIKey(
	ctx context.Context,
	apiKey *APIKey,
) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("missing TenantID in context")
	}

	uri := c.url +
		fmt.Sprintf(IAMAPIKeyEndpoint, tenantID) +
		"/" + apiKey.ID
	log.Debug(uri)

	_, statusCode, err := c.apiKeyCall(ctx, http.MethodDelete, uri, nil)
	if err != nil {
		return err
	}

	if statusCode != http.StatusOK {
		return errors.New("could not delete API Key " + apiKey.ID)
	}

	// Clear cache
	_ = c.apiKeyV1Cache.Delete(ctx, apiKey.Secret)

	log.Debug("Revoked API Key ", apiKey.ID, " ", apiKey.Name)

	return nil
}

func (c *Client) apiKeyCall(
	ctx context.Context,
	method string,
	uri string,
	apiKey *APIKey,
) ([]byte, int, error) {
	ctx, cancel := context.WithTimeout(ctx, httputil.Timeout*time.Second)
	defer cancel()

	headers := make(map[string]string)
	headers[APIKeyAdminProductKey] = c.adminApiKey

	var req *http.Request

	if apiKey != nil {
		payload, err := json.Marshal(apiKey)
		if err != nil {
			return nil, http.StatusInternalServerError, err
		}

		req, _ = http.NewRequestWithContext(ctx, method, uri, bytes.NewReader(payload))
		req.Header.Set("Content-Type", "app/json")
	} else {
		req, _ = http.NewRequestWithContext(ctx, method, uri, http.NoBody)
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	log.Debug("Calling IAM API Key Endpoint ", uri)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Debug("Got error", err)
		return nil, http.StatusInternalServerError, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	log.Debug("Server response status code is ", resp.StatusCode)

	return body, resp.StatusCode, nil
}

// This method will call IAM ext auth endoint to validate the API Key
func (c *Client) validateAPIKeyV1(
	ctx context.Context,
	productID string,
	apiKey string,
) (*string, *IdentityTags) {
	if !c.multitenant {
		if apiKey == c.adminApiKey {
			return &c.singleTenantID, nil
		}

		return nil, nil
	}

	// Check existing cache
	if apiKeyCache, found := identitycache.GetFromCache[apiKeyV1Cache](ctx, c.apiKeyV1Cache, apiKey); found {
		log.Debug("Using cached api key ", apiKeyCache)
		return apiKeyCache.Tenant, apiKeyCache.IdentityTags
	}

	headers := make(map[string]string)
	headers[SessionAPIKeyProductKey] = productID
	headers[APIKeyKey] = apiKey

	log.Debug("Checking IAM API Key Secret")

	statusCode, header := c.extAuth(ctx,
		c.url+IAMExtAuthEndpoint, headers)

	if statusCode == nil || *statusCode != http.StatusOK {
		return nil, nil
	}

	tenant := header.Get(APIKeyTenantKey)
	tags := header.Get(APIKeyTagsKey)

	var newTags IdentityTags
	_ = json.Unmarshal([]byte(tags), &newTags)

	// Encode & cache the result
	_ = identitycache.AddToCache(
		ctx,
		c.apiKeyV1Cache,
		apiKey,
		&apiKeyV1Cache{
			Tenant:       &tenant,
			IdentityTags: &newTags,
		},
	)

	return &tenant, &newTags
}

func (c *Client) extAuth(
	ctx context.Context,
	uri string,
	headers map[string]string,
) (*int, *http.Header) {
	// Create context
	ctx, cancel := context.WithTimeout(ctx, httputil.Timeout*time.Second)
	defer cancel()

	// Create a new request using http
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, uri, http.NoBody)

	// Add headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Debug("Got error", err)
		return nil, nil
	}

	_ = resp.Body.Close()

	log.Debug("Server response status code is ", resp.StatusCode)

	return &resp.StatusCode, &resp.Header
}
