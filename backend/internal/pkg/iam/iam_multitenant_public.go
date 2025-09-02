//go:build !outshift
// +build !outshift

// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"
	"errors"

	"github.com/outshift/identity-service/internal/core/iam/types"
)

type MultitenantClient struct {
}

func NewMultitenantClient() *MultitenantClient {
	return &MultitenantClient{}
}

func (c *MultitenantClient) GetTenantAPIKey(
	ctx context.Context) (apiKey *types.APIKey, err error) {
	return nil, errors.New("multitenant mode is not implemented")
}

func (c *MultitenantClient) CreateTenantAPIKey(
	ctx context.Context,
) (apiKey *types.APIKey, err error) {
	return nil, errors.New("multitenant mode is not implemented")
}

func (c *MultitenantClient) RevokeTenantAPIKey(
	ctx context.Context) (err error) {
	return errors.New("multitenant mode is not implemented")
}
func (c *MultitenantClient) GetAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	return nil, errors.New("multitenant mode is not implemented")
}

func (c *MultitenantClient) CreateAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	return nil, errors.New("multitenant mode is not implemented")
}

func (c *MultitenantClient) RefreshAppAPIKey(ctx context.Context,
	appID string) (apiKey *types.APIKey, err error) {
	return nil, errors.New("multitenant mode is not implemented")
}

func (c *MultitenantClient) RevokeAppAPIKey(ctx context.Context,
	appID string) (err error) {
	return errors.New("multitenant mode is not implemented")
}

func (c *MultitenantClient) AuthJwt(
	ctx context.Context,
	header string) (newCtx context.Context, err error) {
	return nil, errors.New("multitenant mode is not implemented")
}

func (c *MultitenantClient) AuthAPIKey(
	ctx context.Context,
	apiKey string,
	forApp bool,
) (newCtx context.Context, err error) {
	return nil, errors.New("multitenant mode is not implemented")
}
