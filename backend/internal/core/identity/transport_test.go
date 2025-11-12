// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

//nolint:testpackage // this file is testing a private struct
package identity

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func createTestServerWithReqHeadersPropagation(t *testing.T) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for k, v := range r.Header {
			w.Header().Add(k, v[0])
		}

		_, _ = w.Write([]byte(uuid.NewString()))
	}))
}

func TestTransportWithRequestID_should_inject_request_id_in_http_request(t *testing.T) {
	t.Parallel()

	ts := createTestServerWithReqHeadersPropagation(t)
	defer ts.Close()

	requestID := uuid.NewString()
	ctx := identitycontext.InsertRequestID(t.Context(), requestID)

	transport := newTransportWithRequestID()
	client := http.Client{
		Transport: transport,
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, ts.URL, http.NoBody)
	assert.NoError(t, err)

	resp, err := client.Do(req)

	defer func() {
		_ = resp.Body.Close()
	}()

	assert.NoError(t, err)
	assert.Equal(t, requestID, resp.Header.Get("X-Request-Id"))
}

func TestTransportWithRequestID_should_not_inject_request_id_in_http_request(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		ctx context.Context //nolint:containedctx // essential part of the test case
	}{
		"empty request ID in context": {
			ctx: identitycontext.InsertRequestID(t.Context(), ""),
		},
		"context without request ID": {
			ctx: t.Context(),
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			ts := createTestServerWithReqHeadersPropagation(t)
			defer ts.Close()

			transport := newTransportWithRequestID()
			client := http.Client{Transport: transport}

			req, err := http.NewRequestWithContext(tc.ctx, http.MethodGet, ts.URL, http.NoBody)
			assert.NoError(t, err)

			resp, err := client.Do(req)

			defer func() {
				_ = resp.Body.Close()
			}()

			assert.NoError(t, err)

			v, exists := resp.Header[http.CanonicalHeaderKey("X-Request-Id")]
			assert.False(t, exists)
			assert.Empty(t, v)
		})
	}
}
