// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package errutil

import (
	"errors"

	"github.com/agntcy/identity-platform/pkg/log"
)

func Err(err error, customMessage string) error {
	// Print en error to the log
	log.Error(customMessage, ": ", err)

	// If there is a custom message, return it
	if customMessage != "" {
		return errors.New(customMessage)
	}

	// Otherwise, return the error
	return err
}
