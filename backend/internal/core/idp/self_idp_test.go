// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp_test

import (
	"context"
	"testing"

	"github.com/agntcy/identity-service/internal/core/idp"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestSelfIdp_CreateClientCredentialsPair(t *testing.T) {
	t.Parallel()

	userID := uuid.NewString()
	ctx := identitycontext.InsertUserID(context.Background(), userID)
	sut := idp.NewSelfIdp()

	clientCred, err := sut.CreateClientCredentialsPair(ctx)

	assert.NoError(t, err)
	assert.NotNil(t, clientCred)
	assert.Equal(t, userID, clientCred.Issuer)
	assert.NotEmpty(t, clientCred.ClientID)
}
