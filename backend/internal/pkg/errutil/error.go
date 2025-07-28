// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package errutil

import (
	"errors"
	"fmt"
	"strings"

	"github.com/outshift/identity-service/pkg/log"
)

func Err(err error, customMessage string) error {
	message := customMessage

	if err != nil {
		// Get last message if there is an error chain
		allErrs := strings.Split(err.Error(), ":")
		if len(allErrs) > 0 {
			message = fmt.Sprintf(
				"%s: %s",
				customMessage,
				strings.TrimSpace(allErrs[len(allErrs)-1]),
			)
		} else {
			message = fmt.Sprintf("%s: %s", customMessage, err.Error())
		}
	}

	// Log the full error message
	log.Error(customMessage, ": ", err)

	// Return a new error with the custom message
	return errors.New(message)
}
