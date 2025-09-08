// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package identity_test

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	identitymodels "github.com/agntcy/identity/api/client/models"
	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/agntcy/identity/pkg/oidc"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/core/badge"
	badgetypes "github.com/outshift/identity-service/internal/core/badge/types"
	"github.com/outshift/identity-service/internal/core/identity"
	identitymocks "github.com/outshift/identity-service/internal/core/identity/mocks"
	"github.com/outshift/identity-service/internal/core/idp"
	oidctesting "github.com/outshift/identity-service/internal/pkg/oidc/testing"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
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

//nolint:nonamedreturns // we do want named returns for simplicity
func createTestServerThatFails(
	t *testing.T,
	errInfo *identitymodels.V1alpha1ErrorInfo,
) (ts *httptest.Server, host, port string) {
	t.Helper()

	ts = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		err, _ := json.Marshal(map[string]any{
			"message": errInfo.Message,
			"details": []*identitymodels.V1alpha1ErrorInfo{errInfo},
		})
		fmt.Fprintln(w, string(err))
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

func createKeyStoreThatFails(t *testing.T) (*identitymocks.KeyStore, *jwk.Jwk) {
	t.Helper()

	priv, _ := joseutil.GenerateJWK("RS256", "sig", "keyId")

	keyStore := identitymocks.NewKeyStore(t)
	keyStore.EXPECT().
		RetrievePrivKey(t.Context(), mock.Anything).
		Return(nil, errors.New("failed"))

	return keyStore, priv
}

func TestRegisterIssuer(t *testing.T) {
	t.Parallel()

	orgID := uuid.NewString()
	clientCred := &idp.ClientCredentials{Issuer: uuid.NewString()}
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

func TestRegisterIssuer_should_return_err_when_key_generation_fails(t *testing.T) {
	t.Parallel()

	keyStore := identitymocks.NewKeyStore(t)
	keyStore.EXPECT().
		GenerateAndSaveKey(t.Context()).
		Return(nil, errors.New("failed"))

	sut := identity.NewService("", "", keyStore, nil, false)

	_, err := sut.RegisterIssuer(t.Context(), nil, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error generating and saving key for issuer")
}

func TestRegisterIssuer_should_return_err_when_proof_generation_fails(t *testing.T) {
	t.Parallel()

	orgID := uuid.NewString()
	clientCred := &idp.ClientCredentials{Issuer: uuid.NewString()}
	keyStore, priv := createKeyStoreThatFails(t)
	keyStore.EXPECT().GenerateAndSaveKey(t.Context()).Return(priv, nil)

	sut := identity.NewService("", "", keyStore, nil, false)

	_, err := sut.RegisterIssuer(t.Context(), clientCred, orgID)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error generating proof for issuer registration")
}

func TestRegisterIssuer_should_handle_issuer_already_exists_err_based_on_unique_issuer_per_tenant(t *testing.T) {
	t.Parallel()

	orgID := uuid.NewString()
	clientCred := &idp.ClientCredentials{Issuer: uuid.NewString()}
	keyStore, priv := createKeyStore(t)
	keyStore.EXPECT().GenerateAndSaveKey(t.Context()).Return(priv, nil)

	ts, host, port := createTestServerThatFails(t, &identitymodels.V1alpha1ErrorInfo{
		Message: "issuer already exists",
	})
	defer ts.Close()

	testCases := map[string]bool{
		"allow registration when uniqueIssuerPerTenant is false": false,
		"deny registration when uniqueIssuerPerTenant is true":   true,
	}

	//nolint:paralleltest // we should not run the tests in parallel to make sure ts.Close() is called at the end
	for tn, uniqueIssuerPerTenant := range testCases {
		t.Run(tn, func(t *testing.T) {
			sut := identity.NewService(host, port, keyStore, nil, uniqueIssuerPerTenant)

			issuer, err := sut.RegisterIssuer(t.Context(), clientCred, orgID)

			if uniqueIssuerPerTenant {
				assert.Error(t, err)
				assert.ErrorContains(t, err, "error registering issuer")
			} else {
				assert.NoError(t, err)
				assert.Equal(t, &identity.Issuer{CommonName: clientCred.Issuer, KeyID: priv.KID}, issuer)
			}
		})
	}
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

func TestGenerateID_should_return_err_when_proof_generation_fails(t *testing.T) {
	t.Parallel()

	clientCred := &idp.ClientCredentials{Issuer: uuid.NewString()}
	keyStore, priv := createKeyStoreThatFails(t)

	sut := identity.NewService("", "", keyStore, nil, false)

	_, err := sut.GenerateID(
		t.Context(),
		clientCred,
		&identity.Issuer{KeyID: priv.KID, CommonName: clientCred.Issuer},
	)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error generating proof for ID generation")
}

func TestGenerateID_should_return_err_when_identity_node_fails(t *testing.T) {
	t.Parallel()

	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)

	ts, host, port := createTestServerThatFails(t, &identitymodels.V1alpha1ErrorInfo{
		Message: "failed",
	})
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	_, err := sut.GenerateID(
		t.Context(),
		clientCred,
		&identity.Issuer{KeyID: priv.KID, CommonName: clientCred.Issuer},
	)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error generating ID with identity service")
}

func TestGenerateID_should_return_err_when_identity_node_does_not_return_resolver_metadata(t *testing.T) {
	t.Parallel()

	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)
	invalidResponse := "{}"

	ts, host, port := createTestServerWithReqAssert(
		t,
		invalidResponse,
		func(payload *identitymodels.V1alpha1GenerateRequest) {},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	_, err := sut.GenerateID(
		t.Context(),
		clientCred,
		&identity.Issuer{KeyID: priv.KID, CommonName: clientCred.Issuer},
	)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error generating ID with identity service")
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

func TestPublishVerifiableCredential_should_return_err_when_proof_generation_fails(t *testing.T) {
	t.Parallel()

	clientCred := &idp.ClientCredentials{Issuer: uuid.NewString()}
	keyStore, priv := createKeyStoreThatFails(t)

	sut := identity.NewService("", "", keyStore, nil, false)

	err := sut.PublishVerifiableCredential(
		t.Context(),
		clientCred,
		&badgetypes.VerifiableCredential{},
		&identity.Issuer{KeyID: priv.KID},
	)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error generating proof for verifiable credential publishing")
}

func TestPublishVerifiableCredential_should_return_err_when_identity_node_fails(t *testing.T) {
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

	ts, host, port := createTestServerThatFails(t, &identitymodels.V1alpha1ErrorInfo{
		Message: "failed",
	})
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	err = sut.PublishVerifiableCredential(
		t.Context(),
		clientCred,
		&vc.VerifiableCredential,
		&identity.Issuer{KeyID: priv.KID},
	)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed")
}

func TestPublishVerifiableCredential_should_return_err_when_vs_is_nil(t *testing.T) {
	t.Parallel()

	sut := identity.NewService("", "", nil, nil, false)

	err := sut.PublishVerifiableCredential(t.Context(), nil, nil, nil)

	assert.Error(t, err)
	assert.ErrorIs(t, err, identity.ErrVCIsNull)
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

func TestRevokeVerifiableCredential_should_return_err_when_proof_generation_fails(t *testing.T) {
	t.Parallel()

	clientCred := &idp.ClientCredentials{Issuer: uuid.NewString()}
	keyStore, priv := createKeyStoreThatFails(t)

	sut := identity.NewService("", "", keyStore, nil, false)

	err := sut.RevokeVerifiableCredential(
		t.Context(),
		clientCred,
		&badgetypes.VerifiableCredential{},
		&identity.Issuer{KeyID: priv.KID},
	)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error generating proof for verifiable credential publishing")
}

func TestRevokeVerifiableCredential_should_return_err_when_vc_is_empty(t *testing.T) {
	t.Parallel()

	sut := identity.NewService("", "", nil, nil, false)

	err := sut.RevokeVerifiableCredential(t.Context(), nil, nil, nil)

	assert.Error(t, err)
	assert.ErrorIs(t, err, identity.ErrVCIsNull)
}

func TestRevokeVerifiableCredential_should_return_err_when_identity_node_fails(t *testing.T) {
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

	ts, host, port := createTestServerThatFails(t, &identitymodels.V1alpha1ErrorInfo{
		Message: "failed",
	})
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	err = sut.RevokeVerifiableCredential(
		t.Context(),
		clientCred,
		&badg.VerifiableCredential,
		&identity.Issuer{KeyID: priv.KID},
	)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed")
}

func TestRevokeVerifiableCredential_should_pass_when_vc_already_revoked(t *testing.T) {
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

	ts, host, port := createTestServerThatFails(t, &identitymodels.V1alpha1ErrorInfo{
		Reason:  ptrutil.Ptr(identitymodels.V1alpha1ErrorReasonERRORREASONVERIFIABLECREDENTIALREVOKED),
		Message: "failed",
	})
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

func TestVerifyVerifiableCredential(t *testing.T) {
	t.Parallel()

	vc := "VC"

	expectedClaims := map[string]string{
		"id":    uuid.NewString(),
		"badge": uuid.NewString(),
	}
	var expectedResult identitymodels.V1alpha1VerificationResult
	err := gofakeit.Struct(&expectedResult)
	assert.NoError(t, err)
	expectedResult.Document.Content = expectedClaims

	for _, st := range expectedResult.Document.CredentialStatus {
		st.CreatedAt = time.Now().UTC()
	}

	respJson, err := json.Marshal(&expectedResult)
	assert.NoError(t, err)

	ts, host, port := createTestServerWithReqAssert(
		t,
		string(respJson),
		func(payload *identitymodels.V1alpha1VerifyRequest) {
			assert.Equal(t, &identitymodels.V1alpha1EnvelopedCredential{
				EnvelopeType: ptrutil.Ptr(
					identitymodels.V1alpha1CredentialEnvelopeTypeCREDENTIALENVELOPETYPEJOSE,
				),
				Value: vc,
			}, payload.Vc)
		},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, nil, nil, false)

	actualResult, err := sut.VerifyVerifiableCredential(t.Context(), &vc)

	assert.NoError(t, err)
	assert.NotNil(t, actualResult)
	assert.Equal(t, expectedResult.Status, actualResult.Status)
	assert.Equal(t, expectedResult.MediaType, actualResult.MediaType)
	assert.Equal(t, expectedResult.Controller, actualResult.Controller)
	assert.Equal(t, expectedResult.ControlledIdentifierDocument, actualResult.ControlledIdentifierDocument)
	assertVerificationResultDocument(t, expectedResult.Document, expectedClaims, actualResult.Document)

	for idx := range actualResult.Warnings {
		expected := expectedResult.Warnings[idx]
		actual := actualResult.Warnings[idx]
		assert.Equal(t, expected.Message, actual.Message)
		assert.Equal(t, string(*expected.Reason), actual.Reason)
	}

	for idx := range actualResult.Errors {
		expected := expectedResult.Errors[idx]
		actual := actualResult.Errors[idx]
		assert.Equal(t, expected.Message, actual.Message)
		assert.Equal(t, string(*expected.Reason), actual.Reason)
	}
}

func assertVerificationResultDocument(
	t *testing.T,
	expectedResult *identitymodels.V1alpha1VerifiableCredential,
	expectedClaims map[string]string,
	actualResult *badgetypes.VerifiableCredential,
) {
	t.Helper()

	assert.Equal(t, expectedClaims["id"], actualResult.CredentialSubject.ID)
	assert.Equal(t, expectedClaims["badge"], actualResult.CredentialSubject.Badge)
	assert.Equal(t, expectedResult.Context, actualResult.Context)
	assert.Equal(t, expectedResult.Type, actualResult.Type)
	assert.Equal(t, expectedResult.Issuer, actualResult.Issuer)
	assert.Equal(t, expectedResult.ID, actualResult.ID)
	assert.Equal(t, expectedResult.IssuanceDate, actualResult.IssuanceDate)
	assert.Equal(t, expectedResult.ExpirationDate, actualResult.ExpirationDate)

	for idx := range actualResult.CredentialSchema {
		expected := expectedResult.CredentialSchema[idx]
		actual := actualResult.CredentialSchema[idx]
		assert.Equal(t, expected.ID, actual.ID)
		assert.Equal(t, expected.Type, actual.Type)
	}

	for idx := range actualResult.Status {
		expected := expectedResult.CredentialStatus[idx]
		actual := actualResult.Status[idx]
		assert.Equal(t, expected.ID, actual.ID)
		assert.Equal(t, expected.Type, actual.Type)
		assert.Equal(t, badgetypes.CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED, actual.Purpose)
		assert.Equal(t, expected.CreatedAt, actual.CreatedAt)
	}
}

func TestVerifyVerifiableCredential_should_return_err_when_vc_is_empty(t *testing.T) {
	t.Parallel()

	testCases := map[string]*string{
		"fails when vc is nil":   nil,
		"fails when vc is empty": ptrutil.Ptr(""),
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := identity.NewService("", "", nil, nil, false)

			_, err := sut.VerifyVerifiableCredential(t.Context(), tc)

			assert.Error(t, err)
			assert.ErrorContains(t, err, "verifiable credential is empty")
		})
	}
}

func TestVerifyVerifiableCredential_should_return_err_when_identity_node_fails(t *testing.T) {
	t.Parallel()

	ts, host, port := createTestServerThatFails(t, &identitymodels.V1alpha1ErrorInfo{
		Message: "failed",
	})
	defer ts.Close()

	sut := identity.NewService(host, port, nil, nil, false)

	_, err := sut.VerifyVerifiableCredential(t.Context(), ptrutil.Ptr("vc"))

	assert.Error(t, err)
	assert.ErrorContains(t, err, "error verifying verifiable credential")
}

func TestGenerateProof_should_self_issue_valid_jwt(t *testing.T) {
	t.Parallel()

	selfIssuerClientCred := &idp.ClientCredentials{
		Issuer:   uuid.NewString(),
		ClientID: uuid.NewString(),
	}
	keyStore, priv := createKeyStore(t)

	ts, host, port := createTestServerWithReqAssert(
		t,
		"{}",
		func(payload *identitymodels.V1alpha1GenerateRequest) {
			parser := oidc.NewParser()

			jwt, err := parser.ParseJwt(t.Context(), &payload.Proof.ProofValue)
			assert.NoError(t, err)

			err = parser.VerifyJwt(t.Context(), jwt)
			assert.NoError(t, err)

			assert.Equal(t, selfIssuerClientCred.Issuer, jwt.CommonName)
			assert.Equal(t, selfIssuerClientCred.ClientID, jwt.Claims.Subject)
		},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	_, _ = sut.GenerateID(
		t.Context(),
		selfIssuerClientCred,
		&identity.Issuer{KeyID: priv.KID, CommonName: selfIssuerClientCred.Issuer},
	)
}

func TestGenerateProof_should_issue_jwt_from_idp(t *testing.T) {
	t.Parallel()

	idpClientCred := &idp.ClientCredentials{
		Issuer:       uuid.NewString(),
		ClientID:     uuid.NewString(),
		ClientSecret: uuid.NewString(),
	}
	idpAuthenticator := oidctesting.NewValidAuthenticator()

	ts, host, port := createTestServerWithReqAssert(
		t,
		"{}",
		func(payload *identitymodels.V1alpha1GenerateRequest) {
			assert.Equal(t, oidctesting.ValidAccessToken, payload.Proof.ProofValue)
		},
	)
	defer ts.Close()

	sut := identity.NewService(host, port, nil, idpAuthenticator, false)

	_, _ = sut.GenerateID(
		t.Context(),
		idpClientCred,
		&identity.Issuer{KeyID: "", CommonName: idpClientCred.Issuer},
	)
}
