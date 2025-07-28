// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package strutil

import (
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/google/uuid"
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
