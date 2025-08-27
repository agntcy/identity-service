// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package httputil

import (
	"net/url"
)

func Hostname(stringUrl string) string {
	// Parse the URL
	parsedUrl, err := url.Parse(stringUrl)
	if err != nil {
		return ""
	}

	// Extract the hostname from the parsed URL
	return parsedUrl.Hostname()
}
