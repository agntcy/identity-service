// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package convertutil_test

import (
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
)

func TestConvertSlice(t *testing.T) {
	t.Parallel()

	before := []string{"el1", "el2", "el3"}

	after := convertutil.ConvertSlice(before, func(el string) *string {
		return ptrutil.Ptr(el + "CONVERTED")
	})

	for idx, el := range after {
		assert.Equal(t, before[idx]+"CONVERTED", *el)
	}
}

func TestConvertSlice_should_return_empty_slice(t *testing.T) {
	t.Parallel()

	ret := convertutil.ConvertSlice[string, string](nil, nil)

	assert.Empty(t, ret)
}

func TestConvertSlice_should_return_empty_slice_if_convert_is_nil(t *testing.T) {
	t.Parallel()

	ret := convertutil.ConvertSlice[string, string]([]string{"el1"}, nil)

	assert.Empty(t, ret)
}
