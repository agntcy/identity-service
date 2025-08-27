// Copyright 2025 Cisco Systems, Inc. and its affiliates
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
