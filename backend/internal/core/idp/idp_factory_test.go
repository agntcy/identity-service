// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp_test

import (
	"context"
	"testing"

	"github.com/outshift/identity-service/internal/core/idp"
	"github.com/outshift/identity-service/internal/core/settings/types"
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

	t.Run("should return an error when IdpType is unknown", func(t *testing.T) {
		t.Parallel()

		_, err := sut.Create(context.Background(), &types.IssuerSettings{
			IdpType: types.IDP_TYPE_UNSPECIFIED,
		})

		assert.Error(t, err)
		assert.ErrorContains(t, err, "unknown IDP type")
	})
}
