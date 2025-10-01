// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package badge_test

import (
	"encoding/json"
	"testing"

	"github.com/agntcy/identity-service/internal/core/badge"
	"github.com/agntcy/identity-service/internal/core/badge/types"
	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestIssue_should_issue_a_badge(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()
	issuer := uuid.NewString()
	typ := types.BADGE_TYPE_AGENT_BADGE
	claims := &types.BadgeClaims{Badge: uuid.NewString()}
	privKey, _ := joseutil.GenerateJWK("RS256", "sig", "key_id")

	b, err := badge.Issue(appID, issuer, typ, claims, privKey)

	assert.NoError(t, err)
	assert.Equal(t, appID, b.AppID)
	assert.Equal(t, issuer, b.Issuer)
	assert.Equal(t, []string{typ.String()}, b.Type)
	assert.Equal(t, claims, b.CredentialSubject)
}

func TestIssue_should_issue_a_badge_with_valid_jose_proof(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()
	issuer := uuid.NewString()
	typ := types.BADGE_TYPE_AGENT_BADGE
	claims := &types.BadgeClaims{Badge: uuid.NewString()}
	privKey, _ := joseutil.GenerateJWK("RS256", "sig", "key_id")

	b, err := badge.Issue(appID, issuer, typ, claims, privKey)

	assert.NoError(t, err)
	assert.Equal(t, types.JoseProof, b.Proof.Type)

	signedBadge, err := joseutil.Verify(privKey.PublicKey(), []byte(b.Proof.ProofValue))
	assert.NoError(t, err)

	actualBadge, err := getVerifiableCredentialAsJSON(t, &b.VerifiableCredential)
	assert.NoError(t, err)

	assert.Equal(t, signedBadge, actualBadge)
}

func getVerifiableCredentialAsJSON(t *testing.T, b *types.VerifiableCredential) ([]byte, error) {
	t.Helper()

	b.Proof = nil

	return json.Marshal(b)
}

func TestIssue_should_return_err_when_type_is_invalid(t *testing.T) {
	t.Parallel()

	invalidType := types.BADGE_TYPE_UNSPECIFIED

	_, err := badge.Issue("", "", invalidType, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "unsupported badge type")
}

func TestIssue_should_return_err_when_claims_is_nil(t *testing.T) {
	t.Parallel()

	_, err := badge.Issue("", "", types.BADGE_TYPE_AGENT_BADGE, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "invalid badge claims")
}

func TestIssue_should_return_err_when_private_key_is_nil(t *testing.T) {
	t.Parallel()

	_, err := badge.Issue("", "", types.BADGE_TYPE_AGENT_BADGE, &types.BadgeClaims{}, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "invalid privateKey argument")
}
