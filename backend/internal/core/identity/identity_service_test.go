// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package identity_test

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	identitymodels "github.com/agntcy/identity/api/client/models"
	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/core/badge"
	badgetypes "github.com/outshift/identity-service/internal/core/badge/types"
	"github.com/outshift/identity-service/internal/core/identity"
	identitymocks "github.com/outshift/identity-service/internal/core/identity/mocks"
	"github.com/outshift/identity-service/internal/core/idp"
	"github.com/stretchr/testify/assert"
)

//nolint:nonamedreturns // we do want named returns for simplicity
func createTestServerWithReqAssert[T any](
	t *testing.T,
	response string,
	assertReqBody func(payload *T),
) (ts *httptest.Server, host, port string) {
	t.Helper()

	ts = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if assertReqBody != nil {
			body, _ := io.ReadAll(r.Body)

			var payload T
			err := json.Unmarshal(body, &payload)
			assert.NoError(t, err)

			assertReqBody(&payload)
			r.Body.Close()
		}

		w.Header().Add("Content-Type", "application/json")
		_, _ = w.Write([]byte(response))
	}))
	host, port, _ = net.SplitHostPort(strings.ReplaceAll(ts.URL, "http://", ""))

	return ts, host, port
}

func createKeyStore(t *testing.T) (*identitymocks.KeyStore, *jwk.Jwk) {
	t.Helper()

	priv, _ := joseutil.GenerateJWK("RS256", "sig", "keyId")

	keyStore := identitymocks.NewKeyStore(t)
	keyStore.EXPECT().RetrievePrivKey(t.Context(), priv.KID).Return(priv, nil)

	return keyStore, priv
}

func TestRegisterIssuer(t *testing.T) {
	t.Parallel()

	orgID := uuid.NewString()
	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)
	keyStore.EXPECT().GenerateAndSaveKey(t.Context()).Return(priv, nil)

	ts, host, port := createTestServerWithReqAssert(
		t,
		"",
		func(payload *identitymodels.V1alpha1RegisterIssuerRequest) {
			assert.Equal(t, &identitymodels.V1alpha1Issuer{
				Organization: orgID,
				CommonName:   clientCred.Issuer,
				PublicKey: &identitymodels.V1alpha1Jwk{
					Alg: priv.ALG,
					Kty: priv.KTY,
					Use: priv.USE,
					Kid: priv.KID,
					Pub: priv.PUB,
					E:   priv.E,
					N:   priv.N,
				},
			}, payload.Issuer)
		},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	issuer, err := sut.RegisterIssuer(t.Context(), clientCred, orgID)

	assert.NoError(t, err)
	assert.Equal(t, &identity.Issuer{CommonName: clientCred.Issuer, KeyID: priv.KID}, issuer)
}

func TestGenerateID(t *testing.T) {
	t.Parallel()

	expectedID := uuid.NewString()
	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)

	ts, host, port := createTestServerWithReqAssert(
		t,
		fmt.Sprintf(`{"resolverMetadata": {"id": %q}}`, expectedID),
		func(payload *identitymodels.V1alpha1GenerateRequest) {
			assert.Equal(
				t,
				&identitymodels.V1alpha1Issuer{
					CommonName: clientCred.Issuer,
				},
				payload.Issuer,
			)
		},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	actualID, err := sut.GenerateID(
		t.Context(),
		clientCred,
		&identity.Issuer{KeyID: priv.KID, CommonName: clientCred.Issuer},
	)

	assert.NoError(t, err)
	assert.Equal(t, expectedID, actualID)
}

func TestPublishVerifiableCredential(t *testing.T) {
	t.Parallel()

	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)
	vc, err := badge.Issue(
		uuid.NewString(),
		clientCred.Issuer,
		badgetypes.BADGE_TYPE_AGENT_BADGE,
		&badgetypes.BadgeClaims{},
		priv,
	)
	assert.NoError(t, err)

	ts, host, port := createTestServerWithReqAssert(
		t,
		"{}",
		func(payload *identitymodels.V1alpha1PublishRequest) {
			assert.Equal(t, &identitymodels.V1alpha1EnvelopedCredential{
				EnvelopeType: identitymodels.NewV1alpha1CredentialEnvelopeType(
					identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEJOSE,
				),
				Value: vc.Proof.ProofValue,
			}, payload.Vc)
		},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	err = sut.PublishVerifiableCredential(
		t.Context(),
		clientCred,
		&vc.VerifiableCredential,
		&identity.Issuer{KeyID: priv.KID},
	)

	assert.NoError(t, err)
}

func TestRevokeVerifiableCredential(t *testing.T) {
	t.Parallel()

	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)
	badg, err := badge.Issue(
		uuid.NewString(),
		clientCred.Issuer,
		badgetypes.BADGE_TYPE_AGENT_BADGE,
		&badgetypes.BadgeClaims{},
		priv,
	)
	assert.NoError(t, err)

	ts, host, port := createTestServerWithReqAssert(
		t,
		"{}",
		func(payload *identitymodels.V1alpha1RevokeRequest) {
			assert.Equal(t, &identitymodels.V1alpha1EnvelopedCredential{
				EnvelopeType: identitymodels.NewV1alpha1CredentialEnvelopeType(
					identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEJOSE,
				),
				Value: badg.Proof.ProofValue,
			}, payload.Vc)
		},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	err = sut.RevokeVerifiableCredential(
		t.Context(),
		clientCred,
		&badg.VerifiableCredential,
		&identity.Issuer{KeyID: priv.KID},
	)

	assert.NoError(t, err)
}
