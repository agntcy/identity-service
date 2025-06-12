// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package node_test

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"testing"

	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	issuertesting "github.com/agntcy/identity-platform/internal/core/issuer/testing"
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	verificationtesting "github.com/agntcy/identity-platform/internal/core/issuer/verification/testing"
	vctypes "github.com/agntcy/identity-platform/internal/core/vc/types"
	"github.com/agntcy/identity-platform/internal/node"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/stretchr/testify/assert"
)

func TestRegisterIssuer_Should_Not_Register_Same_Issuer_Twice(t *testing.T) {
	t.Parallel()

	verficationSrv := verificationtesting.NewFakeVerifiedVerificationService()
	issuerRepo := issuertesting.NewFakeIssuerRepository()
	sut := node.NewIssuerService(issuerRepo, verficationSrv)
	pubKey, _ := generatePubKey()

	issuer := &issuertypes.Issuer{
		CommonName:   verificationtesting.ValidProofIssuer,
		Organization: "Some Org",
		PublicKey:    pubKey,
	}

	proof := &vctypes.Proof{
		Type:       "JWT",
		ProofValue: "",
	}

	// Register once
	err := sut.Register(context.Background(), issuer, proof)
	assert.NoError(t, err)

	// Attempt to register the same issuer again
	err = sut.Register(context.Background(), issuer, proof)
	assert.Error(t, err)
}

func TestRegisterIssuer_Should_Register_Verified_Issuer(t *testing.T) {
	t.Parallel()

	verficationSrv := verificationtesting.NewFakeVerifiedVerificationService()
	issuerRepo := issuertesting.NewFakeIssuerRepository()
	sut := node.NewIssuerService(issuerRepo, verficationSrv)
	pubKey, _ := generatePubKey()

	issuer := &issuertypes.Issuer{
		CommonName:   verificationtesting.ValidProofIssuer,
		Organization: "Some Org",
		PublicKey:    pubKey,
	}

	proof := &vctypes.Proof{
		Type:       "JWT",
		ProofValue: "",
	}

	// Register once
	err := sut.Register(context.Background(), issuer, proof)
	assert.NoError(t, err)

	// Verify the issuer is registered
	registeredIssuer, err := issuerRepo.GetIssuer(
		context.Background(),
		verificationtesting.ValidProofIssuer,
	)
	assert.NoError(t, err)
	assert.NotNil(t, registeredIssuer)
	assert.Equal(t, registeredIssuer.Verified, true)
}

func TestRegisterIssuer_Should_Register_Unverified_Issuer(t *testing.T) {
	t.Parallel()

	verficationSrv := verificationtesting.NewFakeUnverifiedVerificationServiceStub()
	issuerRepo := issuertesting.NewFakeIssuerRepository()
	sut := node.NewIssuerService(issuerRepo, verficationSrv)
	pubKey, _ := generatePubKey()

	issuer := &issuertypes.Issuer{
		CommonName:   verificationtesting.ValidProofIssuer,
		Organization: "Some Org",
		PublicKey:    pubKey,
	}

	proof := &vctypes.Proof{
		Type:       "JWT",
		ProofValue: "",
	}

	// Register once
	err := sut.Register(context.Background(), issuer, proof)
	assert.NoError(t, err)

	// Verify the issuer is registered
	registeredIssuer, err := issuerRepo.GetIssuer(
		context.Background(),
		verificationtesting.ValidProofIssuer,
	)
	assert.NoError(t, err)
	assert.NotNil(t, registeredIssuer)
	assert.Equal(t, registeredIssuer.Verified, false)
}

func generatePubKey() (*idtypes.Jwk, error) {
	pk, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, err
	}

	pubkey, err := jwk.PublicRawKeyOf(pk)
	if err != nil {
		return nil, err
	}

	key, err := jwk.Import(pubkey)
	if err != nil {
		return nil, err
	}

	err = key.Set(jwk.AlgorithmKey, jwa.RS256())
	if err != nil {
		return nil, err
	}

	keyAsJson, err := json.Marshal(key)
	if err != nil {
		return nil, err
	}

	var k idtypes.Jwk

	err = json.Unmarshal(keyAsJson, &k)
	if err != nil {
		return nil, err
	}

	return &k, nil
}
