// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package httputil

import (
	"context"
	"net/http"
	"time"

	"github.com/agntcy/identity-service/pkg/log"
)

// Timeout : API timeout time
const Timeout = 5

func Get(
	ctx context.Context,
	uri string,
	headers map[string]string,
) (*http.Response, error) {
	// Create context
	ctx, cancel := context.WithTimeout(ctx, Timeout*time.Second)
	defer cancel()

	// Create a new request using http
	log.FromContext(ctx).Debug("Getting uri ", uri)

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, uri, http.NoBody)

	// Add headers
	log.FromContext(ctx).Debug("Getting with headers ", headers)

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Send req using http Client
	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		log.FromContext(ctx).Debug("Got error", err)
		return nil, err
	}

	return resp, nil
}
