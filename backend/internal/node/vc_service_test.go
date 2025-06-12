// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package node_test

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	errtypes "github.com/agntcy/identity-platform/internal/core/errors/types"
	idtesting "github.com/agntcy/identity-platform/internal/core/id/testing"
	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	issuertesting "github.com/agntcy/identity-platform/internal/core/issuer/testing"
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	verificationtesting "github.com/agntcy/identity-platform/internal/core/issuer/verification/testing"
	vctesting "github.com/agntcy/identity-platform/internal/core/vc/testing"
	vctypes "github.com/agntcy/identity-platform/internal/core/vc/types"
	"github.com/agntcy/identity-platform/internal/node"
	"github.com/agntcy/identity-platform/internal/pkg/oidc"
	oidctesting "github.com/agntcy/identity-platform/internal/pkg/oidc/testing"
	"github.com/google/uuid"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jws"
	"github.com/stretchr/testify/assert"
)

func TestPublishVC(t *testing.T) {
	t.Parallel()

	idRepo := idtesting.NewFakeIdRepository()
	issuerRepo := issuertesting.NewFakeIssuerRepository()
	vcRepo := vctesting.NewFakeVCRepository()
	jwt := &oidc.ParsedJWT{
		Provider: oidc.DuoProviderName,
		Claims: &oidc.Claims{
			Issuer:  "http://" + verificationtesting.ValidProofIssuer,
			Subject: verificationtesting.ValidProofSub,
		},
		Verified:   true,
		CommonName: verificationtesting.ValidProofIssuer,
	}
	idGen := node.NewIDGenerator(
		oidctesting.NewFakeParser(jwt, nil),
		issuerRepo,
	)
	sut := node.NewVerifiableCredentialService(idRepo, issuerRepo, vcRepo, idGen)
	issuer := &issuertypes.Issuer{
		CommonName:   verificationtesting.ValidProofIssuer,
		Organization: "Some Org",
	}
	_, _ = issuerRepo.CreateIssuer(context.Background(), issuer)
	credential := &vctypes.VerifiableCredential{
		ID: "VC_ID",
	}

	envelope, pubKey, err := signVCWithJose(credential)
	assert.NoError(t, err)

	resolverMD := &idtypes.ResolverMetadata{
		ID: fmt.Sprintf("DUO-%s", verificationtesting.ValidProofSub),
		VerificationMethod: []*idtypes.VerificationMethod{
			{
				ID:           pubKey.KID,
				PublicKeyJwk: pubKey,
			},
		},
	}
	_, _ = idRepo.CreateID(context.Background(), resolverMD, issuer)

	err = sut.Publish(context.Background(), envelope, &vctypes.Proof{Type: "JWT"})

	assert.NoError(t, err)
}

func TestPublishVC_Should_Return_Invalid_Credential_Format_Error(t *testing.T) {
	t.Parallel()

	sut := node.NewVerifiableCredentialService(nil, nil, nil, nil)
	invalidEnvelope := &vctypes.EnvelopedCredential{
		Value: "",
	}

	err := sut.Publish(context.Background(), invalidEnvelope, &vctypes.Proof{})

	assertErrorInfoReason(t, err, errtypes.ERROR_REASON_INVALID_CREDENTIAL_ENVELOPE_VALUE_FORMAT)
}

func TestPublishVC_Should_Return_Invalid_Proof_Error_If_Empty(t *testing.T) {
	t.Parallel()

	idGen := node.NewIDGenerator(oidctesting.NewFakeParser(nil, nil), nil)
	sut := node.NewVerifiableCredentialService(nil, nil, nil, idGen)
	invalidEnvelope := &vctypes.EnvelopedCredential{
		Value: "something",
	}

	err := sut.Publish(context.Background(), invalidEnvelope, nil)

	assertErrorInfoReason(t, err, errtypes.ERROR_REASON_INVALID_PROOF)
}

func TestPublishVC_Should_Return_Invalid_Proof_Error(t *testing.T) {
	t.Parallel()

	idGen := node.NewIDGenerator(oidctesting.NewFakeParser(nil, errors.New("")), nil)
	sut := node.NewVerifiableCredentialService(nil, nil, nil, idGen)
	invalidEnvelope := &vctypes.EnvelopedCredential{
		Value: "something",
	}

	err := sut.Publish(context.Background(), invalidEnvelope, &vctypes.Proof{Type: "JWT"})

	assertErrorInfoReason(t, err, errtypes.ERROR_REASON_INVALID_PROOF)
}

func TestPublishVC_Should_Return_Issuer_Not_Registered(t *testing.T) {
	t.Parallel()

	idRepo := idtesting.NewFakeIdRepository()
	issuerRepo := issuertesting.NewFakeIssuerRepository()
	vcRepo := vctesting.NewFakeVCRepository()
	jwt := &oidc.ParsedJWT{
		Provider: oidc.DuoProviderName,
		Claims: &oidc.Claims{
			Subject: verificationtesting.ValidProofSub,
			Issuer:  "INVALID",
		},
	}
	idGen := node.NewIDGenerator(
		oidctesting.NewFakeParser(jwt, nil),
		issuerRepo,
	)
	sut := node.NewVerifiableCredentialService(idRepo, issuerRepo, vcRepo, idGen)
	issuer := &issuertypes.Issuer{
		CommonName:   verificationtesting.ValidProofIssuer,
		Organization: "Some Org",
	}
	_, _ = issuerRepo.CreateIssuer(context.Background(), issuer)
	credential := &vctypes.VerifiableCredential{
		ID: "VC_ID",
	}

	envelope, pubKey, err := signVCWithJose(credential)
	assert.NoError(t, err)

	resolverMD := &idtypes.ResolverMetadata{
		ID: fmt.Sprintf("DUO-%s", verificationtesting.ValidProofSub),
		VerificationMethod: []*idtypes.VerificationMethod{
			{
				ID:           pubKey.KID,
				PublicKeyJwk: pubKey,
			},
		},
	}
	_, _ = idRepo.CreateID(context.Background(), resolverMD, issuer)

	err = sut.Publish(context.Background(), envelope, &vctypes.Proof{Type: "JWT"})

	assertErrorInfoReason(t, err, errtypes.ERROR_REASON_ISSUER_NOT_REGISTERED)
}

func TestGetWellKnown_Should_Return_Items(t *testing.T) {
	t.Parallel()

	vcRepo := vctesting.NewFakeVCRepository()
	sut := node.NewVerifiableCredentialService(nil, nil, vcRepo, nil)
	resolverMetadatID := "my-id"

	validVC, _ := vcRepo.Create(t.Context(), &vctypes.VerifiableCredential{
		ID:                uuid.NewString(),
		CredentialSubject: map[string]any{"id": resolverMetadatID},
		Proof:             &vctypes.Proof{Type: "JWT", ProofValue: "PROOF"},
	}, resolverMetadatID)
	_, _ = vcRepo.Create(t.Context(), &vctypes.VerifiableCredential{
		ID:                uuid.NewString(),
		CredentialSubject: map[string]any{"id": resolverMetadatID},
		Proof:             &vctypes.Proof{Type: "NOPE", ProofValue: "PROOF"},
	}, resolverMetadatID)

	actual, err := sut.GetVcs(t.Context(), resolverMetadatID)

	assert.NoError(t, err)
	assert.Len(t, actual, 1)
	assert.Equal(t, vctypes.CREDENTIAL_ENVELOPE_TYPE_JOSE, actual[0].EnvelopeType)
	assert.Equal(t, validVC.Proof.ProofValue, actual[0].Value)
}

func signVCWithJose(
	vc *vctypes.VerifiableCredential,
) (*vctypes.EnvelopedCredential, *idtypes.Jwk, error) {
	pk, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, nil, err
	}

	payload, err := json.Marshal(vc)
	if err != nil {
		return nil, nil, err
	}

	hdrs := jws.NewHeaders()

	err = hdrs.Set(jws.KeyIDKey, "KEY-ID")
	if err != nil {
		return nil, nil, err
	}

	signed, err := jws.Sign(payload, jws.WithKey(jwa.RS256(), pk, jws.WithProtectedHeaders(hdrs)))
	if err != nil {
		return nil, nil, err
	}

	pubkey, err := jwk.PublicRawKeyOf(pk)
	if err != nil {
		return nil, nil, err
	}

	key, err := jwk.Import(pubkey)
	if err != nil {
		return nil, nil, err
	}

	err = key.Set(jwk.AlgorithmKey, jwa.RS256())
	if err != nil {
		return nil, nil, err
	}

	keyAsJson, err := json.Marshal(key)
	if err != nil {
		return nil, nil, err
	}

	var k idtypes.Jwk

	err = json.Unmarshal(keyAsJson, &k)
	if err != nil {
		return nil, nil, err
	}

	k.KID, _ = hdrs.KeyID()

	return &vctypes.EnvelopedCredential{
		EnvelopeType: vctypes.CREDENTIAL_ENVELOPE_TYPE_JOSE,
		Value:        string(signed),
	}, &k, nil
}
