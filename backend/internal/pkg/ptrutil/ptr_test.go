// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package ptrutil_test

import (
	"testing"
	"time"

	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

type dummyEmbeddedType struct {
	Field3 int64
	Field4 time.Time
}

type dummyType struct {
	Field1 string
	Field2 dummyEmbeddedType
}

func TestPtr(t *testing.T) {
	t.Parallel()

	obj := dummyType{
		Field1: uuid.NewString(),
		Field2: dummyEmbeddedType{
			Field3: int64(123456),
			Field4: time.Now().UTC(),
		},
	}

	ret := ptrutil.Ptr(obj)

	assert.Equal(t, &obj, ret)
	assert.Equal(t, obj, *ret)
}

func TestDerefrence(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		src            *dummyType
		defaultValue   dummyType
		expectedResult dummyType
	}{
		"should return a dereferenced value of src": {
			src: &dummyType{
				Field1: "some value",
				Field2: dummyEmbeddedType{
					Field3: int64(123456),
				},
			},
			defaultValue: dummyType{},
			expectedResult: dummyType{
				Field1: "some value",
				Field2: dummyEmbeddedType{
					Field3: int64(123456),
				},
			},
		},
		"should return default value when src is nil": {
			src:            nil,
			defaultValue:   dummyType{Field1: "default"},
			expectedResult: dummyType{Field1: "default"},
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actualResult := ptrutil.Derefrence(tc.src, tc.defaultValue)

			assert.EqualValues(t, tc.expectedResult, actualResult)
		})
	}
}

func TestDerefStr(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		src            *string
		expectedResult string
	}{
		"should return the str in src": {
			src:            ptrutil.Ptr("good value"),
			expectedResult: "good value",
		},
		"should return empty str when src is nil": {
			src:            nil,
			expectedResult: "",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actualResult := ptrutil.DerefStr(tc.src)

			assert.EqualValues(t, tc.expectedResult, actualResult)
		})
	}
}
