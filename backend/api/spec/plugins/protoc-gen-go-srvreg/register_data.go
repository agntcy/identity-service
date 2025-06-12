// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

type ServiceData struct {
	ServerName              string
	ServerType              string
	RegisterGrpcServerFunc  string
	RegisterHttpHandlerFunc string
}

type RegisterTemplateData struct {
	Services []*ServiceData
}
