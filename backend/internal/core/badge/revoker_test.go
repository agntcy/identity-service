// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package badge_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/core/badge"
	badgemocks "github.com/outshift/identity-service/internal/core/badge/mocks"
	"github.com/outshift/identity-service/internal/core/badge/types"
	identitycore "github.com/outshift/identity-service/internal/core/identity"
	identitymocks "github.com/outshift/identity-service/internal/core/identity/mocks"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func generateValidTestSetupForRevokeAll(
	t *testing.T,
	ctx context.Context,
	appID string,
	clientCreds *idpcore.ClientCredentials,
	issuer *identitycore.Issuer,
	badges []*types.Badge,
) badge.Revoker {
	t.Helper()

	badgeRepo := badgemocks.NewRepository(t)
	badgeRepo.EXPECT().GetAllActiveBadges(ctx, appID).Return(badges, nil)
	badgeRepo.EXPECT().Update(ctx, mock.Anything).Return(nil)

	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		RevokeVerifiableCredential(ctx, clientCreds, mock.Anything, issuer).
		Return(nil)

	return badge.NewRevoker(badgeRepo, identityServ)
}

func TestRevoker_RevokeAll_should_revoke_all_badges(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	appID := uuid.NewString()
	badges := []*types.Badge{
		{
			AppID:                appID,
			VerifiableCredential: types.VerifiableCredential{ID: uuid.NewString()},
		},
	}
	clientCreds := &idpcore.ClientCredentials{}
	issuer := &identitycore.Issuer{}
	privKey, _ := joseutil.GenerateJWK("RS256", "sig", "key_id")

	sut := generateValidTestSetupForRevokeAll(t, ctx, appID, clientCreds, issuer, badges)

	err := sut.RevokeAll(ctx, appID, clientCreds, issuer, privKey)

	assert.NoError(t, err)
	assert.Contains(
		t,
		badges[0].Status[0].ID,
		"https://spec.identity.agntcy.org/protodocs/agntcy/identity/core/v1alpha1/vc.proto",
	)
	assert.Equal(t, "CredentialStatus", badges[0].Status[0].Type)
	assert.Equal(t, types.CREDENTIAL_STATUS_PURPOSE_REVOCATION, badges[0].Status[0].Purpose)
	assert.Greater(t, badges[0].Status[0].CreatedAt, time.Now().Add(-time.Minute).UTC())
}

func TestRevoker_RevokeAll_should_resign_badges_after_revocation(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	appID := uuid.NewString()
	badges := []*types.Badge{
		{
			AppID:                appID,
			VerifiableCredential: types.VerifiableCredential{ID: uuid.NewString()},
		},
	}
	clientCreds := &idpcore.ClientCredentials{}
	issuer := &identitycore.Issuer{}
	privKey, _ := joseutil.GenerateJWK("RS256", "sig", "key_id")

	sut := generateValidTestSetupForRevokeAll(t, ctx, appID, clientCreds, issuer, badges)

	_ = sut.RevokeAll(ctx, appID, clientCreds, issuer, privKey)

	signedBadge, err := joseutil.Verify(privKey.PublicKey(), []byte(badges[0].Proof.ProofValue))
	assert.NoError(t, err)

	actualBadge, err := getVerifiableCredentialAsJSON(t, &badges[0].VerifiableCredential)
	assert.NoError(t, err)

	assert.Equal(t, signedBadge, actualBadge)
}

func TestRevoker_RevokeAll_should_do_nothing_when_no_active_badge_found(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	appID := uuid.NewString()

	badgeRepo := badgemocks.NewRepository(t)
	badgeRepo.EXPECT().GetAllActiveBadges(ctx, appID).Return(nil, nil)

	sut := badge.NewRevoker(badgeRepo, nil)

	err := sut.RevokeAll(ctx, appID, nil, nil, nil)

	assert.NoError(t, err)
}

func TestRevoker_RevokeAll_should_return_err_when_unable_to_get_active_badges(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	appID := uuid.NewString()

	badgeRepo := badgemocks.NewRepository(t)
	badgeRepo.EXPECT().GetAllActiveBadges(ctx, appID).Return(nil, errors.New("error"))

	sut := badge.NewRevoker(badgeRepo, nil)

	err := sut.RevokeAll(ctx, appID, nil, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error")
}

func TestRevoker_RevokeAll_should_return_err_when_cannot_revoke_badge(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	appID := uuid.NewString()
	privKey, _ := joseutil.GenerateJWK("RS256", "sig", "key_id")

	badgeRepo := badgemocks.NewRepository(t)
	badgeRepo.EXPECT().
		GetAllActiveBadges(ctx, appID).
		Return([]*types.Badge{{VerifiableCredential: types.VerifiableCredential{}}}, nil)

	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		RevokeVerifiableCredential(ctx, mock.Anything, mock.Anything, mock.Anything).
		Return(errors.New("error"))

	sut := badge.NewRevoker(badgeRepo, identityServ)

	err := sut.RevokeAll(ctx, appID, nil, nil, privKey)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "identity service failed to revoke badge")
}

func TestRevoker_RevokeAll_should_return_err_when_cannot_sign_revoked_badge(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	appID := uuid.NewString()

	var invalidPrivKey *jwk.Jwk

	badgeRepo := badgemocks.NewRepository(t)
	badgeRepo.EXPECT().
		GetAllActiveBadges(ctx, appID).
		Return([]*types.Badge{{VerifiableCredential: types.VerifiableCredential{}}}, nil)

	sut := badge.NewRevoker(badgeRepo, nil)

	err := sut.RevokeAll(ctx, appID, nil, nil, invalidPrivKey)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "unable to sign the badge: private key is nil")
}

func TestRevoker_RevokeAll_should_return_err_when_cannot_save_badge(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	appID := uuid.NewString()
	badges := []*types.Badge{
		{
			AppID:                appID,
			VerifiableCredential: types.VerifiableCredential{ID: uuid.NewString()},
		},
	}
	clientCreds := &idpcore.ClientCredentials{}
	issuer := &identitycore.Issuer{}
	privKey, _ := joseutil.GenerateJWK("RS256", "sig", "key_id")

	badgeRepo := badgemocks.NewRepository(t)
	badgeRepo.EXPECT().GetAllActiveBadges(ctx, appID).Return(badges, nil)
	badgeRepo.EXPECT().Update(ctx, mock.Anything).Return(errors.New("error"))

	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		RevokeVerifiableCredential(ctx, clientCreds, mock.Anything, issuer).
		Return(nil)

	sut := badge.NewRevoker(badgeRepo, identityServ)

	err := sut.RevokeAll(ctx, appID, clientCreds, issuer, privKey)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "repository failed to save revoked badge")
}
