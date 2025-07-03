// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identity

import (
	"fmt"

	identitysrv "github.com/agntcy/identity/api/server/agntcy/identity/core/v1alpha1"
)

type ErrorInfo struct {
	Reason  identitysrv.ErrorReason
	Message string
}

func (err ErrorInfo) Error() string {
	return fmt.Sprintf("%s (reason: %s)", err.Message, err.Reason.String())
}
