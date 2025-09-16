// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package strutil

import (
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
)

func SafeUuidString(u *uuid.UUID) *string {
	if u == nil {
		return nil
	}

	return ptrutil.Ptr(u.String())
}

func SafeUuid(u *string) *uuid.UUID {
	if u == nil {
		return nil
	}

	return ptrutil.Ptr(uuid.MustParse(*u))
}
