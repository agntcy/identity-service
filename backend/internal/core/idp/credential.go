// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"errors"
)

const (
	mountPath = "credentials"
)

var ErrCredentialNotFound = errors.New("credential not found")

type CredentialStore interface {
	Get(
		ctx context.Context,
		subject string,
	) (*ClientCredentials, error)
	Put(
		ctx context.Context,
		cred *ClientCredentials,
		subject string,
	) error
	Delete(
		ctx context.Context,
		subject string,
	) error
}
