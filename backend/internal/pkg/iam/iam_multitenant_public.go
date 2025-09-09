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

// ErrMultitenantNotImplemented is returned by all MultitenantClient methods in non-Outshift builds.
var ErrMultitenantNotImplemented = errors.New(
	"multitenant mode is not implemented",
)

// MultitenantClient is a stub for multitenant IAM operations in non-Outshift builds.
type MultitenantClient struct{}

// NewMultitenantClient returns a new stub MultitenantClient.
func NewMultitenantClient() *MultitenantClient {
	return &MultitenantClient{}
}

// GetTenantAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) GetTenantAPIKey(
	ctx context.Context,
) (*types.APIKey, error) {
	return nil, ErrMultitenantNotImplemented
}

// CreateTenantAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) CreateTenantAPIKey(
	ctx context.Context,
) (*types.APIKey, error) {
	return nil, ErrMultitenantNotImplemented
}

// RevokeTenantAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) RevokeTenantAPIKey(ctx context.Context) error {
	return ErrMultitenantNotImplemented
}

// GetAppAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) GetAppAPIKey(
	ctx context.Context,
	appID string,
) (*types.APIKey, error) {
	return nil, ErrMultitenantNotImplemented
}

// CreateAppAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) CreateAppAPIKey(
	ctx context.Context,
	appID string,
) (*types.APIKey, error) {
	return nil, ErrMultitenantNotImplemented
}

// RefreshAppAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) RefreshAppAPIKey(
	ctx context.Context,
	appID string,
) (*types.APIKey, error) {
	return nil, ErrMultitenantNotImplemented
}

// RevokeAppAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) RevokeAppAPIKey(ctx context.Context, appID string) error {
	return ErrMultitenantNotImplemented
}

// AuthJwt returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) AuthJwt(
	ctx context.Context,
	header string) (newCtx context.Context, err error) {
	return newCtx, ErrMultitenantNotImplemented
}

// AuthAPIKey returns an error indicating multitenant mode is not implemented.
func (c *MultitenantClient) AuthAPIKey(
	ctx context.Context,
	apiKey string,
	forApp bool,
) (newCtx context.Context, err error) {
	return newCtx, ErrMultitenantNotImplemented
}
