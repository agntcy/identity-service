// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

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
