// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package httputil_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/httputil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestData_Get_should_return_resp_obj_with_correct_status_code(t *testing.T) {
	t.Parallel()

	for tc := 200; tc <= 599; tc++ {
		// we don't run the tests in parallel to avoid having multiple servers binding the same port
		t.Run(fmt.Sprintf("should return status code %d", tc), func(t *testing.T) {
			ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc)
			}))
			defer ts.Close()

			resp, err := httputil.Get(context.Background(), ts.URL, nil)
			resp.Body.Close()

			assert.NoError(t, err)
			assert.NotNil(t, resp)
			assert.Equal(t, tc, resp.StatusCode)
		})
	}
}

func TestData_Get_should_pass_headers_to_the_request(t *testing.T) {
	t.Parallel()

	headers := map[string]string{
		"header_1": uuid.NewString(),
		"header_2": uuid.NewString(),
		"header_3": uuid.NewString(),
	}

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for k, v := range headers {
			canonicalHeaderKey := textproto.CanonicalMIMEHeaderKey(k)
			assert.Contains(t, r.Header, canonicalHeaderKey)
			assert.Equal(t, []string{v}, r.Header[canonicalHeaderKey])
		}

		fmt.Fprint(w, uuid.NewString())
	}))
	defer ts.Close()

	resp, _ := httputil.Get(context.Background(), ts.URL, headers)
	resp.Body.Close()
}
