// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

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
