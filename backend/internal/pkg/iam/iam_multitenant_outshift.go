//go:build outshift
// +build outshift

// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"
	"net/http"

	"github.com/agntcy/identity-service/internal/core/iam/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/pkg/cmd"
	"github.com/agntcy/identity-service/pkg/log"
	outshiftiam "github.com/cisco-eti/iam-sdk-golang/iam"
)

//nolint:lll // Ignore linting for long lines
type Configuration struct {
	IamProductID   string `split_words:"true" required:"true"`
	IamApiUrl      string `split_words:"true" required:"true"`
	IamAdminAPIKey string `split_words:"true"`
	IamIssuer      string `split_words:"true"`
	IamUserCid     string `split_words:"true"`
	IamApiKeyCid   string `split_words:"true"`
}

const (
	identityAppLabel    = "Identity-App-"
	identityTenantLabel = "Identity-Tenant-"
)

type MultitenantClient struct {
	outshiftiamClient outshiftiam.Client
}

func NewMultitenantClient() *MultitenantClient {
	config, err := cmd.GetConfiguration[Configuration]()
	if err != nil {
		log.WithError(err).Fatal("failed to load IAM configuration")
	}

	outshiftiamClient := outshiftiam.NewClient(
		http.DefaultClient,
		config.IamProductID,
		config.IamApiUrl,
		config.IamAdminAPIKey,
		&config.IamIssuer,
		&config.IamUserCid,
		&config.IamApiKeyCid,
		ptrutil.Ptr(identityTenantLabel),
		ptrutil.Ptr(identityAppLabel),
	)

	return &MultitenantClient{
		outshiftiamClient: outshiftiamClient,
	}
}

func (c *MultitenantClient) GetTenantAPIKey(
	ctx context.Context) (apiKey *types.APIKey, err error) {
	iamAPIKey, err := c.outshiftiamClient.GetTenantAPIKey(ctx)

	return c.convertToCoreType(iamAPIKey), err
}

func (c *MultitenantClient) CreateTenantAPIKey(
	ctx context.Context,
) (apiKey *types.APIKey, err error) {
	iamAPIKey, err := c.outshiftiamClient.CreateTenantAPIKey(ctx)

	return c.convertToCoreType(iamAPIKey), err
}

func (c *MultitenantClient) RevokeTenantAPIKey(
	ctx context.Context) (err error) {

	return c.outshiftiamClient.RevokeTenantAPIKey(ctx)
}
func (c *MultitenantClient) GetAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	iamAPIKey, err := c.outshiftiamClient.GetAppAPIKey(ctx, appID)

	return c.convertToCoreType(iamAPIKey), err
}

func (c *MultitenantClient) CreateAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	iamAPIKey, err := c.outshiftiamClient.CreateAppAPIKey(ctx, appID)

	return c.convertToCoreType(iamAPIKey), err
}

func (c *MultitenantClient) RefreshAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	iamAPIKey, err := c.outshiftiamClient.RefreshAppAPIKey(ctx, appID)

	return c.convertToCoreType(iamAPIKey), err
}

func (c *MultitenantClient) RevokeAppAPIKey(ctx context.Context,
	appID string) (err error) {
	return c.outshiftiamClient.RevokeAppAPIKey(ctx, appID)
}

func (c *MultitenantClient) AuthJwt(
	ctx context.Context,
	header string) (newCtx context.Context, err error) {
	return c.outshiftiamClient.AuthJwt(ctx, header)
}

func (c *MultitenantClient) AuthAPIKey(
	ctx context.Context,
	apiKey string,
	forApp bool,
) (newCtx context.Context, err error) {
	return c.outshiftiamClient.AuthAPIKey(ctx, apiKey, forApp)
}

func (c *MultitenantClient) convertToCoreType(
	iamAPIKey outshiftiam.APIKey,
) *types.APIKey {
	if iamAPIKey.Secret == "" {
		return nil
	}

	return &types.APIKey{
		ID:       iamAPIKey.ID,
		Name:     iamAPIKey.Name,
		Secret:   ptrutil.Ptr(iamAPIKey.Secret),
		TenantID: iamAPIKey.TenantID,
		AppID:    ptrutil.Ptr(iamAPIKey.Tags.AppID),
	}
}
