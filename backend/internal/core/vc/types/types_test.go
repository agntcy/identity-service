// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types_test

import (
	"encoding/json"
	"testing"

	"github.com/agntcy/identity-saas/internal/core/vc/types"
	"github.com/stretchr/testify/assert"
)

func TestMarshalJson_CredentialEnvelopeType(t *testing.T) {
	t.Parallel()

	t.Run("Marshal CREDENTIAL_ENVELOPE_TYPE_EMBEDDED_PROOF", func(t *testing.T) {
		t.Parallel()
		enum := types.CREDENTIAL_ENVELOPE_TYPE_EMBEDDED_PROOF

		b, err := json.Marshal(enum)

		assert.NoError(t, err)
		assert.Equal(t, "\"CREDENTIAL_ENVELOPE_TYPE_EMBEDDED_PROOF\"", string(b))
	})

	t.Run("Marshal CREDENTIAL_ENVELOPE_TYPE_JOSE", func(t *testing.T) {
		t.Parallel()
		enum := types.CREDENTIAL_ENVELOPE_TYPE_JOSE

		b, err := json.Marshal(enum)

		assert.NoError(t, err)
		assert.Equal(t, "\"CREDENTIAL_ENVELOPE_TYPE_JOSE\"", string(b))
	})
}

func TestUnmarshalJson_CredentialEnvelopeType(t *testing.T) {
	t.Parallel()

	blob := `["CREDENTIAL_ENVELOPE_TYPE_EMBEDDED_PROOF", "CREDENTIAL_ENVELOPE_TYPE_JOSE"]`
	var tt []types.CredentialEnvelopeType

	err := json.Unmarshal([]byte(blob), &tt)

	assert.NoError(t, err)
	assert.Contains(t, tt, types.CREDENTIAL_ENVELOPE_TYPE_EMBEDDED_PROOF)
	assert.Contains(t, tt, types.CREDENTIAL_ENVELOPE_TYPE_JOSE)
}
