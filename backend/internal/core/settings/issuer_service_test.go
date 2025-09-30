// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Issuerentifier: Apache-2.0

package settings_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/core/identity"
	identitymocks "github.com/outshift/identity-service/internal/core/identity/mocks"
	"github.com/outshift/identity-service/internal/core/idp"
	idpmocks "github.com/outshift/identity-service/internal/core/idp/mocks"
	settingscore "github.com/outshift/identity-service/internal/core/settings"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestIssuerService_SetIssuer_should_succeed(t *testing.T) {
	t.Parallel()

	orgID := uuid.NewString()
	ctx := identitycontext.InsertOrganizationID(context.Background(), orgID)
	ctx = identitycontext.InsertUserID(ctx, uuid.NewString())
	issuerSettings := settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_SELF,
	}
	issuer := identity.Issuer{
		CommonName: uuid.NewString(),
		KeyID:      uuid.NewString(),
	}

	idpFactory := idp.NewFactory()

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Put(ctx, mock.Anything, mock.Anything).Return(nil)

	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().RegisterIssuer(ctx, mock.Anything, orgID).Return(&issuer, nil)

	sut := settingscore.NewIssuerService(identityServ, idpFactory, credStore)

	err := sut.SetIssuer(ctx, &issuerSettings)

	assert.NoError(t, err)
	assert.Equal(t, issuer.CommonName, issuerSettings.IssuerID)
	assert.Equal(t, issuer.KeyID, issuerSettings.KeyID)
}

func TestIssuerService_SetIssuer_should_return_err_when_ctx_does_not_contain_org(t *testing.T) {
	t.Parallel()

	invalidCtx := context.Background()
	sut := settingscore.NewIssuerService(nil, nil, nil)

	err := sut.SetIssuer(invalidCtx, &settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_SELF,
	})

	assert.Error(t, err)
	assert.ErrorIs(t, err, identitycontext.ErrOrganizationNotFound)
}

func TestIssuerService_SetIssuer_should_return_err_when_ctx_does_not_contain_user_id(t *testing.T) {
	t.Parallel()

	invalidCtx := identitycontext.InsertOrganizationID(context.Background(), uuid.NewString())
	idpFactory := idp.NewFactory()
	sut := settingscore.NewIssuerService(nil, idpFactory, nil)

	err := sut.SetIssuer(invalidCtx, &settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_SELF,
	})

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to create client credentials pair")
}

func TestIssuerService_SetIssuer_should_return_err_when_input_is_nil(t *testing.T) {
	t.Parallel()

	sut := settingscore.NewIssuerService(nil, nil, nil)

	err := sut.SetIssuer(context.Background(), nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "issuer settings cannot be nil")
}

func TestIssuerService_SetIssuer_should_return_err_when_registration_fails(t *testing.T) {
	t.Parallel()

	orgID := uuid.NewString()
	ctx := identitycontext.InsertOrganizationID(context.Background(), orgID)
	ctx = identitycontext.InsertUserID(ctx, uuid.NewString())
	issuerSettings := settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_SELF,
	}

	idpFactory := idp.NewFactory()

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Put(ctx, mock.Anything, mock.Anything).Return(nil)

	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		RegisterIssuer(ctx, mock.Anything, orgID).
		Return(nil, errors.New("failed"))

	sut := settingscore.NewIssuerService(identityServ, idpFactory, credStore)

	err := sut.SetIssuer(ctx, &issuerSettings)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to register issuer")
}
