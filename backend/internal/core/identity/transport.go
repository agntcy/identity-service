// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identity

import (
	"net/http"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
)

// transportWithRequestID is an HTTP transport that propagates the request ID to the Identity Node
type transportWithRequestID struct {
	Transport http.RoundTripper
}

func (t *transportWithRequestID) RoundTrip(req *http.Request) (*http.Response, error) {
	reqID, ok := identitycontext.GetRequestID(req.Context())
	if !ok || reqID == "" {
		return t.Transport.RoundTrip(req)
	}

	if req.Header == nil {
		req.Header = make(http.Header)
	}

	req.Header.Add("X-Request-Id", reqID)

	return t.Transport.RoundTrip(req)
}

func newTransportWithRequestID() *transportWithRequestID {
	return &transportWithRequestID{
		Transport: http.DefaultTransport,
	}
}
