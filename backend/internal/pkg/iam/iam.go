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

type ApiKey struct {
	ID       string        `json:"id,omitempty"`
	Name     string        `json:"name,omitempty"`
	Secret   string        `json:"secret,omitempty"`
	TenantID string        `json:"tenantId,omitempty"`
	Tags     *IdentityTags `json:"tags,omitempty"`
}

func NewApiKey() ApiKey {
	return ApiKey{
		Tags: &IdentityTags{},
	}
}

type ApiKeyList struct {
	ApiKeys []ApiKey `json:"apiKeys,omitempty"`
}

// Api Key V1 Cache
const defaultApiKeyV1ExpirationTime = 60        // In seconds
const defaultApiKeyCacheSize = 10 * 1024 * 1024 // 10MB

type apiKeyV1Cache struct {
	IdentityTags *IdentityTags
	Tenant       *string
}

// Header keys
const (
	SessionAccessTokenKey   string = "Authorization"
	TenantClaimKey          string = "tenant"
	UsernameClaimKey        string = "sub"
	OrganizationClaimKey    string = "organization"
	ApiKeyKey               string = "x-id-api-key"     //nolint:gosec // This is a false positive
	ApiKeyTenantKey         string = "x-api-key-tenant" //nolint:gosec // This is a false positive
	ApiKeyTagsKey           string = "x-api-key-tags"   //nolint:gosec // This is a false positive
	SessionApiKeyProductKey string = "x-id-product"     //nolint:gosec // This is a false positive
	ApiKeyAdminProductKey   string = "x-auth-token"     //nolint:gosec // This is a false positive
	AuthTypeJWTToken        string = "jwt-token"
	AuthTypeApiKey          string = "api-key"
)

// IAM Endpoints
const IAMExtAuthEndpoint = "/ext-auth"
const IAMApiKeyEndpoint = "/admin/tenant/%s/api-key" //nolint:gosec // This is a false positive
const IAMCreateApiKeyEndpoint = "/api-key"
const IAMTenantEndpoint = "/tenant"

const defaultIAMAud = "api://default"

type Client interface {
	AuthJwt(
		ctx context.Context,
		header string,
	) (newCtx context.Context, err error)
	AuthApiKey(
		ctx context.Context,
		productID string,
		apiKey string,
		forApp bool,
	) (newCtx context.Context, err error)
	GetTenantApiKey(ctx context.Context) (apiKey ApiKey, err error)
	GetAppApiKey(ctx context.Context, appID string) (apiKey ApiKey, err error)
	CreateTenantApiKey(ctx context.Context) (apiKey ApiKey, err error)
	CreateAppApiKey(ctx context.Context, appID string) (apiKey ApiKey, err error)
	RevokeTenantApiKey(ctx context.Context) (err error)
	RevokeAppApiKey(ctx context.Context, appID string) (err error)
}

type HttpClient struct {
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
) Client {
	// Init verifier for UI and Api Keys
	toValidateForUser := map[string]string{}
	toValidateForApiKey := map[string]string{}

	// Add both cid from UI or ApiKeys
	toValidateForUser["aud"] = defaultIAMAud
	toValidateForUser["cid"] = *userCid
	toValidateForApiKey["aud"] = defaultIAMAud
	toValidateForApiKey["cid"] = *apiKeyCid

	userJwtVerifierSetup := jwtverifier.JwtVerifier{
		Issuer:           *issuer,
		ClaimsToValidate: toValidateForUser,
	}
	apiKeyJwtVerifierSetup := jwtverifier.JwtVerifier{
		Issuer:           *issuer,
		ClaimsToValidate: toValidateForApiKey,
	}

	userJwtVerifier := userJwtVerifierSetup.New()
	apiKeyV2JwtVerifier := apiKeyJwtVerifierSetup.New()

	// Add cache for V1
	freecacheStore := freecache_store.NewFreecache(
		freecache.NewCache(defaultApiKeyCacheSize),
		store.WithExpiration(defaultApiKeyV1ExpirationTime*time.Second),
	)
	apiKeyV1Cache := cache.New[[]byte](freecacheStore)

	return &HttpClient{
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

func (c *HttpClient) AuthJwt(
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

	username, tenant, organization, validateErr := c.validateAccessToken(ctx, accessToken)
	if validateErr != nil {
		return ctx, errors.New("JWT validation failed")
	}

	ctx = identitycontext.InsertTenantID(ctx, *tenant)
	log.Debug("Validated JWT for tenant ", *tenant)

	// Add username if present
	if username != nil {
		ctx = identitycontext.InsertUserID(ctx, *username)
	}

	// Add organization if present
	if organization != nil {
		ctx = identitycontext.InsertOrganizationID(ctx, *organization)
	}

	ctx = identitycontext.InsertAuthType(ctx, AuthTypeJWTToken)

	return ctx, nil
}

func (c *HttpClient) AuthApiKey(
	ctx context.Context,
	productID string,
	apiKey string,
	forApp bool,
) (context.Context, error) {
	if apiKey == "" {
		return ctx, errors.New("no Api Key")
	}

	tenant, tags := c.validateApiKeyV1(ctx, productID, apiKey)
	if tenant == nil {
		return ctx, errors.New("api Key validation failed")
	}

	ctx = identitycontext.InsertTenantID(ctx, *tenant)
	ctx = identitycontext.InsertAuthType(ctx, AuthTypeApiKey)

	if !c.multitenant {
		ctx = identitycontext.InsertAppID(ctx, singleTenantAppID)

		return ctx, nil
	}

	if !forApp && tags.AppID != "" {
		// This is a app id
		return ctx, errors.New("api Key validation failed")
	}

	// Insert appID
	ctx = identitycontext.InsertAppID(ctx, tags.AppID)

	return ctx, nil
}

// GetTenantApiKey returns the Api Key for the tenant. If no Api Key exists, an empty Api Key is returned.
func (c *HttpClient) GetTenantApiKey(ctx context.Context) (ApiKey, error) {
	apiKey := NewApiKey()

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

	apiKey, err := c.getApiKeyByTenant(ctx, tenantID)
	if err != nil {
		return apiKey, err
	}

	log.Debug("Returning Api Key ", apiKey.ID)

	return apiKey, nil
}

// GetAppApiKey returns the Api Key for the app. If no Api Key exists, an empty Api Key is returned.
func (c *HttpClient) GetAppApiKey(ctx context.Context, appID string) (ApiKey, error) {
	if appID == "" {
		return ApiKey{}, errors.New("missing appID")
	}

	if !c.multitenant {
		return ApiKey{}, errors.New("operation not supported in single tenant mode")
	}

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return ApiKey{}, errors.New("missing TenantID in context")
	}

	apiKey, err := c.getApiKeyByApp(ctx, appID, tenantID)
	if err != nil {
		return ApiKey{}, err
	}

	return apiKey, nil
}

// CreateTenantApiKey creates an Api Key for a tenant. The Api Key is unique per tenant.
func (c *HttpClient) CreateTenantApiKey(ctx context.Context) (ApiKey, error) {
	var apiKey ApiKey

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return apiKey, errors.New("missing TenantID in context")
	}

	log.Debug(
		fmt.Sprintf(
			"Creating Api Key for tenant: %s)",
			tenantID,
		),
	)

	if !c.multitenant {
		return c.GetTenantApiKey(ctx)
	}

	apiKey.Name = identityTenantLabel + tenantID

	log.Debug("Creating Api Key ", apiKey.ID)

	createErr := c.createApiKey(ctx, &apiKey)
	if createErr != nil {
		return apiKey, createErr
	}

	log.Debug("Created Api Key ", apiKey.ID)

	return apiKey, nil
}

// CreateAppApiKey creates an Api Key for a app. The Api Key is tagged with the appID.
func (c *HttpClient) CreateAppApiKey(
	ctx context.Context,
	appID string,
) (ApiKey, error) {
	apiKey := NewApiKey()

	if appID == "" {
		return apiKey, errors.New("missing appID")
	}

	if !c.multitenant {
		return c.GetTenantApiKey(ctx)
	}

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return apiKey, errors.New("missing TenantID in context")
	}

	log.Debug(
		fmt.Sprintf(
			"Creating Api Key for app %s (tenant: %s)",
			appID,
			tenantID,
		),
	)

	apiKey.Name = identityAppLabel + appID
	apiKey.Tags.AppID = appID

	log.Debug("Creating Api Key ", apiKey)

	createErr := c.createApiKey(ctx, &apiKey)
	if createErr != nil {
		return apiKey, createErr
	}

	log.Debug("Created Api Key ", apiKey.ID)
	// The response does not return Tags. Insert them here
	apiKey.Tags.AppID = appID

	return apiKey, nil
}

// RevokeTenantApiKey revokes the Api Key for a tenant.
func (c *HttpClient) RevokeTenantApiKey(ctx context.Context) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("missing TenantID in context")
	}

	if !c.multitenant {
		return errors.New("operation not supported in single tenant mode")
	}

	apiKey, err := c.getApiKeyByTenant(ctx, tenantID)
	if err != nil {
		log.Debug("Api Key for tenant " + tenantID + "not found. Ignoring")
		return err
	}

	if apiKey == (ApiKey{}) {
		log.Debug("Api Key for tenant " + tenantID + "not found. Ignoring")
		return nil
	}

	return c.revokeApiKey(ctx, &apiKey)
}

// RevokeAppApiKey revokes the Api Key for a app.
func (c *HttpClient) RevokeAppApiKey(ctx context.Context, appID string) error {
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

	apiKey, err := c.getApiKeyByApp(ctx, appID, tenantID)
	if err != nil {
		log.Debug("Api Key for app " + appID + "not found. Ignoring")
		return err
	}

	if apiKey == (ApiKey{}) {
		log.Debug("Api Key for app " + appID + "not found. Ignoring")
		return nil
	}

	return c.revokeApiKey(ctx, &apiKey)
}

// This method will use Okta library to validate JWTs from both User / Api Key
func (c *HttpClient) validateAccessToken(
	_ context.Context,
	accessToken string,
) (*string, *string, *string, error) {
	var token *jwtverifier.Jwt
	var verifyErr error

	token, verifyErr = c.userJwtVerifier.VerifyAccessToken(accessToken)
	if verifyErr != nil {
		log.Debug("Got error validating user jwt, trying api key", verifyErr)

		// Try with Api Key V2
		token, verifyErr = c.apiKeyV2JwtVerifier.VerifyAccessToken(accessToken)
		if verifyErr != nil {
			log.Debug("Got error validating api key", verifyErr)
			return nil, nil, nil, verifyErr
		}
	}

	var username *string
	if usernameRaw, ok := token.Claims[UsernameClaimKey].(string); ok {
		username = &usernameRaw
	}

	var organization *string
	if organizationRaw, ok := token.Claims[OrganizationClaimKey].(string); ok {
		organization = &organizationRaw
	}

	var tenant *string

	if c.multitenant {
		if tenantRaw, ok := token.Claims[TenantClaimKey].(string); ok {
			tenant = &tenantRaw
		}
	} else {
		tenant = &c.singleTenantID
	}

	return username, tenant, organization, nil
}

func (c *HttpClient) createApiKey(
	ctx context.Context,
	apiKey *ApiKey,
) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("missing TenantID in context")
	}

	uri := c.url + fmt.Sprintf(IAMApiKeyEndpoint, tenantID)

	body, _, err := c.apiKeyCall(ctx, http.MethodPost, uri, apiKey)
	if err != nil {
		return errors.New("could not create Api Key got error" + err.Error())
	}

	err = json.Unmarshal(body, apiKey)
	if err != nil {
		return errors.New("could not create Api Key")
	}

	log.Debug("Created Api Key ", apiKey.ID)

	return nil
}

func (c *HttpClient) getApiKeyByTenant(
	ctx context.Context,
	tenantID string,
) (ApiKey, error) {
	var apiKey ApiKey

	uri := c.url + fmt.Sprintf(IAMApiKeyEndpoint, tenantID)

	body, _, err := c.apiKeyCall(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return apiKey, errors.New("could not get Api Key for tenant " + tenantID)
	}

	apiKeys := ApiKeyList{}

	err = json.Unmarshal(body, &apiKeys)
	if err != nil {
		return apiKey, errors.New("could not get Api Key for tenant " + tenantID)
	}

	for _, k := range apiKeys.ApiKeys {
		if k.Tags == nil || k.Tags.AppID == "" {
			apiKey = k
			break
		}
	}

	return apiKey, nil
}

func (c *HttpClient) getApiKeyByApp(
	ctx context.Context,
	appID string,
	tenantID string,
) (ApiKey, error) {
	var apiKey ApiKey

	uri := c.url + fmt.Sprintf(IAMApiKeyEndpoint, tenantID)

	body, _, err := c.apiKeyCall(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return apiKey, errors.New("could not get Api Key for app " + appID)
	}

	apiKeys := ApiKeyList{}

	err = json.Unmarshal(body, &apiKeys)
	if err != nil {
		return apiKey, errors.New("could not get Api Key for app " + appID)
	}

	for _, k := range apiKeys.ApiKeys {
		if k.Tags != nil && k.Tags.AppID == appID {
			apiKey = k
			break
		}
	}

	return apiKey, nil
}

func (c *HttpClient) revokeApiKey(
	ctx context.Context,
	apiKey *ApiKey,
) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("missing TenantID in context")
	}

	uri := c.url +
		fmt.Sprintf(IAMApiKeyEndpoint, tenantID) +
		"/" + apiKey.ID
	log.Debug(uri)

	_, statusCode, err := c.apiKeyCall(ctx, http.MethodDelete, uri, nil)
	if err != nil {
		return err
	}

	if statusCode != http.StatusOK {
		return errors.New("could not delete Api Key " + apiKey.ID)
	}

	// Clear cache
	_ = c.apiKeyV1Cache.Delete(ctx, apiKey.Secret)

	log.Debug("Revoked Api Key ", apiKey.ID, " ", apiKey.Name)

	return nil
}

func (c *HttpClient) apiKeyCall(
	ctx context.Context,
	method string,
	uri string,
	apiKey *ApiKey,
) ([]byte, int, error) {
	ctx, cancel := context.WithTimeout(ctx, httputil.Timeout*time.Second)
	defer cancel()

	headers := make(map[string]string)
	headers[ApiKeyAdminProductKey] = c.adminApiKey

	log.Debug("Calling IAM Api Key Endpoint ", uri)
	log.Debug("Method: ", method)
	log.Debug("Headers: ", headers)

	var req *http.Request

	if apiKey != nil {
		payload, err := json.Marshal(apiKey)
		if err != nil {
			return nil, http.StatusInternalServerError, err
		}

		req, _ = http.NewRequestWithContext(ctx, method, uri, bytes.NewReader(payload))
		log.Debug("Payload: ", string(payload))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequestWithContext(ctx, method, uri, http.NoBody)
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	log.Debug("Calling IAM Api Key Endpoint ", uri)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Debug("Got error", err)
		return nil, http.StatusInternalServerError, err
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	log.Debug("Server response status code is ", resp.StatusCode)

	return body, resp.StatusCode, nil
}

// This method will call IAM ext auth endoint to validate the Api Key
func (c *HttpClient) validateApiKeyV1(
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
	headers[SessionApiKeyProductKey] = productID
	headers[ApiKeyKey] = apiKey

	log.Debug("Checking IAM Api Key Secret")

	statusCode, header := c.extAuth(ctx,
		c.url+IAMExtAuthEndpoint, headers)

	if statusCode == nil || *statusCode != http.StatusOK {
		return nil, nil
	}

	tenant := header.Get(ApiKeyTenantKey)
	tags := header.Get(ApiKeyTagsKey)

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

func (c *HttpClient) extAuth(
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
