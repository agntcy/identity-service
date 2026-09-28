// Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package jwtutil_test

import (
	"encoding/base64"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/jwtutil"
)

// FuzzJWTVerify checks that arbitrary JWT input cannot crash the verifier.
func FuzzJWTVerify(f *testing.F) {
	f.Add("")
	f.Add("not a JWT")
	encode := base64.RawURLEncoding.EncodeToString
	f.Add(encode([]byte(`{"alg":"none"}`)) + "." + encode([]byte(`{"sub":"agent"}`)) + ".")
	f.Add(encode([]byte(`{"alg":"HS256"}`)) + "." + encode([]byte(`{"sub":"agent"}`)) + ".signature")

	f.Fuzz(func(t *testing.T, token string) {
		if len(token) > 64*1024 {
			t.Skip()
		}

		err := jwtutil.Verify(token)
		if token == "" && err == nil {
			t.Fatal("empty JWT was accepted")
		}
	})
}
