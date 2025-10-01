// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package identitycache_test

import (
	"testing"

	identitycache "github.com/agntcy/identity-service/internal/pkg/cache"
	"github.com/coocood/freecache"
	"github.com/eko/gocache/lib/v4/cache"
	freecache_store "github.com/eko/gocache/store/freecache/v4"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestInMemoryCache(t *testing.T) {
	t.Parallel()

	freecacheStore := freecache_store.NewFreecache(freecache.NewCache(1024))
	c := cache.New[[]byte](freecacheStore)
	key := "my_key"
	value := uuid.NewString()

	err := identitycache.AddToCache(t.Context(), c, key, &value)
	assert.NoError(t, err)

	actual, ok := identitycache.GetFromCache[string](t.Context(), c, key)
	assert.True(t, ok)
	assert.NotNil(t, actual)
	assert.Equal(t, value, *actual)
}
