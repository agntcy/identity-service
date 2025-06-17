// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identitycontext

import (
	"context"
	"errors"
)

// InsertTenantID inserts tenantID into the context.
func InsertTenantID(ctx context.Context, tenantID string) context.Context {
	if tenantID != "" {
		return withTenantID(ctx, tenantID)
	}

	return ctx
}

// Used to extract a tenant id that must exist within the context, otherwise panic
func MustHaveTenantID(ctx context.Context) string {
	id, keyExists := ctx.Value(TenantID).(string)

	// make sure key exists and tenantID value is actually set to something
	if keyExists && id != "" {
		return id
	}

	// The context doesn't contain a tenant ID, this is required for isolation and is classified as a programming error.
	// Fundamenatal root causes:
	// The originating http request doesn't contain the tenant ID field
	// or the field has been removed from the context at some stage through the processing pipeline.

	panic(errors.New("context doesn't contain a tenant id"))
}

// TenantID fetches the tenant ID from a context (if any).
func GetTenantID(ctx context.Context) (string, bool) {
	tenantID, ok := ctx.Value(TenantID).(string)

	return tenantID, ok
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

// InsertAuthType inserts authType into the context.
func InsertAuthType(ctx context.Context, authType string) context.Context {
	if authType != "" {
		return withAuthType(ctx, authType)
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
func withTenantID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, TenantID, id)
}

// WithUserID injects a user ID to a context.
func withUserID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, UserID, id)
}

// WithOrganizationID injects an organization ID to a context.
func withOrganizationID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, OrganizationID, id)
}

// WithTypeAuth injects a type auth to a context.
func withAuthType(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, AuthType, id)
}

// Injects an app ID to a context.
func withAppID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, AppID, id)
}
