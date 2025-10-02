// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

//nolint:testpackage // this file is testing a private function
package idp

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestIdp_GetName(t *testing.T) {
	t.Parallel()

	name := getName()

	assert.Contains(t, name, integrationPrefix)
	assert.Len(t, name, len(uuid.NewString())+len(integrationPrefix))
}
