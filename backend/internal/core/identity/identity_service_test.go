// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package identity_test

import (
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

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

func createTestServerWithResponse(
	t *testing.T,
	resp string,
) (ts *httptest.Server, host string, port string) {
	t.Helper()

	ts = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		w.Write([]byte(resp))
	}))
	host, port, _ = net.SplitHostPort(strings.ReplaceAll(ts.URL, "http://", ""))

	return
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

	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)
	keyStore.EXPECT().GenerateAndSaveKey(t.Context()).Return(priv, nil)

	ts, host, port := createTestServerWithResponse(t, "")
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	issuer, err := sut.RegisterIssuer(t.Context(), clientCred, uuid.NewString())

	assert.NoError(t, err)
	assert.Equal(t, &identity.Issuer{CommonName: clientCred.Issuer, KeyID: priv.KID}, issuer)
}

func TestGenerateID(t *testing.T) {
	t.Parallel()

	expectedID := uuid.NewString()
	clientCred := &idp.ClientCredentials{Issuer: "something"}
	keyStore, priv := createKeyStore(t)

	ts, host, port := createTestServerWithResponse(t, fmt.Sprintf(`{"resolverMetadata": {"id": "%s"}}`, expectedID))
	defer ts.Close()

	sut := identity.NewService(host, port, keyStore, nil, false)

	actualID, err := sut.GenerateID(t.Context(), clientCred, &identity.Issuer{KeyID: priv.KID})

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

	ts, host, port := createTestServerWithResponse(t, "{}")
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
