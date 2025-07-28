// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package httputil

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/agntcy/identity-service/pkg/log"
)

// Timeout : API timeout time
const Timeout = 5

// GetJSON : Get data
func GetJSON(ctx context.Context, uri string, result interface{}) error {
	return getJSON(ctx, uri, nil, result)
}

func GetWithRawBody(
	ctx context.Context,
	uri string,
	headers map[string]string,
	result *string,
) error {
	resp, err := Get(ctx, uri, headers)
	if err != nil {
		log.Debug("Got error", err)
		return err
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	// Read and parse data
	body, _ := io.ReadAll(resp.Body)

	log.Debug("Server response status code is ", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status code = %d", resp.StatusCode)
	}

	*result = string(body)

	return nil
}

func Get(ctx context.Context,
	uri string,
	headers map[string]string,
) (*http.Response, error) {
	// Create context
	ctx, cancel := context.WithTimeout(ctx, Timeout*time.Second)
	defer cancel()

	// Create a new request using http
	log.Debug("Getting uri ", uri)

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, uri, http.NoBody)

	// Add headers
	log.Debug("Getting with headers ", headers)

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Send req using http Client
	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		log.Debug("Got error", err)
		return nil, err
	}

	return resp, nil
}

func getJSON(
	ctx context.Context,
	uri string,
	headers map[string]string,
	result interface{},
) error {
	resp, err := Get(ctx, uri, headers)
	if err != nil {
		log.Debug("Got error", err)
		return err
	}

	// Read and parse data
	body, _ := io.ReadAll(resp.Body)

	log.Debug("Server response status code is ", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		return err
	}

	jsonErr := json.Unmarshal(body, &result)

	if jsonErr != nil {
		log.Debug("Got error ", jsonErr)
		return err
	}

	return resp.Body.Close()
}
