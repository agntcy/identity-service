// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

//nolint:testpackage // contextLogFieldsKey needs to be accessed by the tests
package log

import (
	"context"
	"testing"

	"github.com/google/uuid"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

func TestWithContextualAttributes(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertAppID(context.Background(), uuid.NewString())

	ctx1 := WithContextualAttributes(ctx, logrus.Fields{
		"key1": "new",
	})

	fields := ctx1.Value(contextLogFieldsKey{})

	assert.Equal(t, logrus.Fields{
		"key1": "new",
	}, fields)

	ctx2 := WithContextualAttributes(ctx1, logrus.Fields{
		"key1": "newest",
		"key2": "new",
	})

	fields = ctx2.Value(contextLogFieldsKey{})

	assert.Equal(t, logrus.Fields{
		"key1": "newest",
		"key2": "new",
	}, fields)
}
