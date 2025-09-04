// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package httputil_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"testing"

	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/pkg/httputil"
	"github.com/stretchr/testify/assert"
)

func TestData_GetWithRawBody(t *testing.T) {
	t.Parallel()

	body := uuid.NewString()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, body)
	}))
	defer ts.Close()

	var result string

	err := httputil.GetWithRawBody(context.Background(), ts.URL, nil, &result)

	assert.NoError(t, err)
	assert.Equal(t, body, result)
}

func TestData_GetWithRawBody_should_return_err_when_status_is_not_200(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "bad request", http.StatusBadRequest)
	}))
	defer ts.Close()

	err := httputil.GetWithRawBody(context.Background(), ts.URL, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "status code = 400")
}

func TestData_Get_should_return_resp_obj_with_correct_status_code(t *testing.T) {
	t.Parallel()

	//nolint:paralleltest // we don't run the tests in parallel to avoid having multipe servers binding the same port
	for tc := 200; tc <= 599; tc++ {
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

type dummyTestStruct struct {
	Field1 string
	Field2 int64
	Field3 bool
}

func TestData_GetJSON(t *testing.T) {
	t.Parallel()

	expectedObj := dummyTestStruct{
		Field1: uuid.NewString(),
		Field2: 123456,
		Field3: true,
	}

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := json.Marshal(&expectedObj)
		fmt.Fprint(w, string(b))
	}))
	defer ts.Close()

	var result dummyTestStruct

	err := httputil.GetJSON(context.Background(), ts.URL, &result)

	assert.NoError(t, err)
	assert.Equal(t, expectedObj, result)
}

func TestData_GetJSON_should_return_err_when_status_is_not_200(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "bad request", http.StatusBadRequest)
	}))
	defer ts.Close()

	err := httputil.GetJSON(context.Background(), ts.URL, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "status code = 400")
}

func TestData_GetJSON_should_return_err_when_json_is_invalid(t *testing.T) {
	t.Parallel()

	invalidJSON := "invalid"

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, invalidJSON)
	}))
	defer ts.Close()

	err := httputil.GetJSON(context.Background(), ts.URL, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "invalid JSON body")
}
