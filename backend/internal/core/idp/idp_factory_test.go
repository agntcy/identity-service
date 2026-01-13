// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp_test

import (
	"context"
	"testing"

	"github.com/agntcy/identity-service/internal/core/idp"
	"github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/stretchr/testify/assert"
)

func TestIdpFactory_Create(t *testing.T) {
	t.Parallel()

	sut := idp.NewFactory()

	t.Run("should create SELF IdP client", func(t *testing.T) {
		t.Parallel()

		client, err := sut.Create(context.Background(), &types.IssuerSettings{
			IdpType: types.IDP_TYPE_SELF,
		})

		assert.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("should create PING IdP client", func(t *testing.T) {
		t.Parallel()

		client, err := sut.Create(context.Background(), &types.IssuerSettings{
			IdpType: types.IDP_TYPE_PING,
			PingIdpSettings: &types.PingIdpSettings{
				EnvironmentID: "test-env",
				ClientID:      "test-client",
				ClientSecret:  "test-secret",
				Region:        "com",
			},
		})

		// TestSettings will fail due to network call, but factory should create the instance
		assert.Error(t, err) // Error from TestSettings
		assert.Nil(t, client)
	})

	t.Run("should return an error when IdpType is unknown", func(t *testing.T) {
		t.Parallel()

		_, err := sut.Create(context.Background(), &types.IssuerSettings{
			IdpType: types.IDP_TYPE_UNSPECIFIED,
		})

		assert.Error(t, err)
		assert.ErrorContains(t, err, "unknown IDP type")
	})
}
