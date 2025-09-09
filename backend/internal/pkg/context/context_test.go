// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identitycontext_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/stretchr/testify/assert"
)

func TestIdentityContext_Insert(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		insert func(ctx context.Context, value string) context.Context
		get    func(ctx context.Context) (string, bool)
	}{
		"should insert tenant ID": {
			insert: identitycontext.InsertTenantID,
			get:    identitycontext.GetTenantID,
		},
		"should insert app ID": {
			insert: identitycontext.InsertAppID,
			get:    identitycontext.GetAppID,
		},
		"should insert user ID": {
			insert: identitycontext.InsertUserID,
			get:    identitycontext.GetUserID,
		},
		"should insert organization ID": {
			insert: identitycontext.InsertOrganizationID,
			get:    identitycontext.GetOrganizationID,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			value := uuid.NewString()
			ctx := tc.insert(context.Background(), value)

			actual, ok := tc.get(ctx)

			assert.True(t, ok)
			assert.Equal(t, value, actual)
		})
	}
}

func TestIdentityContext_MustHaveTenantID_should_return_id(t *testing.T) {
	t.Parallel()

	tenantID := uuid.NewString()
	ctx := identitycontext.InsertTenantID(context.Background(), tenantID)

	actual, _ := identitycontext.GetTenantID(ctx)

	assert.Equal(t, tenantID, actual)
}
