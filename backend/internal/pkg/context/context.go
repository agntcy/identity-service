// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identitycontext

import (
	"context"
	"errors"

	"github.com/agntcy/identity/pkg/log"
)

var ErrTenantNotFound = errors.New("context doesn't contain a tenant id")
var ErrAppNotFound = errors.New("context doesn't contain an app id")

// InsertTenantID inserts tenantID into the context.
func InsertTenantID(ctx context.Context, tenantID string) context.Context {
	if tenantID != "" {
		return withTenantID(ctx, tenantID)
	}

	return ctx
}

// TenantID fetches the tenant ID from a context (if any).
func GetTenantID(ctx context.Context) (string, bool) {
	tenantID, ok := ctx.Value(TenantID).(string)
	log.Debug("Fetched tenant ID from context:", ctx)
	log.Debug(ctx.Value("tenant-id"))

	return tenantID, ok
}

// AppID fetches the app ID from a context (if any).
func GetAppID(ctx context.Context) (string, bool) {
	appID, ok := ctx.Value(AppID).(string)

	return appID, ok
}

// UserID fetches the user ID from a context (if any).
func GetUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(UserID).(string)

	return userID, ok
}

// InsertUserID inserts userID into the context.
func InsertUserID(ctx context.Context, userID string) context.Context {
	if userID != "" {
		return withUserID(ctx, userID)
	}

	return ctx
}

func GetOrganizationID(ctx context.Context) (string, bool) {
	organizationID, ok := ctx.Value(OrganizationID).(string)

	return organizationID, ok
}

// InsertOrganizationID inserts organizationID into the context.
func InsertOrganizationID(ctx context.Context, organizationID string) context.Context {
	if organizationID != "" {
		return withOrganizationID(ctx, organizationID)
	}

	return ctx
}

// Inserts the app ID into the context.
func InsertAppID(ctx context.Context, appID string) context.Context {
	if appID != "" {
		return withAppID(ctx, appID)
	}

	return ctx
}

// WithTenantID injects a tenant ID to a context.
//
//nolint:staticcheck // using types instead of string will break private IAM context
func withTenantID(ctx context.Context, id string) context.Context {
	return context.WithValue(
		ctx,
		TenantID,
		id,
	)
}

// WithUserID injects a user ID to a context.
//
//nolint:staticcheck // using types instead of string will break private IAM context
func withUserID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, UserID, id)
}

// WithOrganizationID injects an organization ID to a context.
//
//nolint:staticcheck // using types instead of string will break private IAM context
func withOrganizationID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, OrganizationID, id)
}

// Injects an app ID to a context.
//
//nolint:staticcheck // using types instead of string will break private IAM context
func withAppID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, AppID, id)
}
