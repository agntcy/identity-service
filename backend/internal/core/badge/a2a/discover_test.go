// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package a2a_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/outshift/identity-service/internal/core/badge/a2a"
	"github.com/stretchr/testify/assert"
)

func TestDiscover(t *testing.T) {
	t.Parallel()

	card := `{"name": "some_random_agent", "skills": []}`

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, card)
	}))
	defer ts.Close()

	sut := a2a.NewDiscoveryClient()

	ret, err := sut.Discover(context.Background(), ts.URL)

	assert.NoError(t, err)
	assert.Equal(t, card, ret)
}

func TestDiscover_should_add_wellknow_suffix(t *testing.T) {
	t.Parallel()

	card := `{"name": "some_random_agent", "skills": []}`

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/.well-known/agent.json", r.URL.Path)
		fmt.Fprint(w, card)
	}))
	defer ts.Close()

	sut := a2a.NewDiscoveryClient()

	_, _ = sut.Discover(context.Background(), ts.URL)
}

func TestDiscover_should_return_error_if_status_is_not_ok(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "error", http.StatusInternalServerError)
	}))
	defer ts.Close()

	sut := a2a.NewDiscoveryClient()

	_, err := sut.Discover(context.Background(), ts.URL)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to get agent card with status code: 500")
}
