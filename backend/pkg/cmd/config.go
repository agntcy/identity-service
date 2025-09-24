// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package cmd

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/outshift/identity-service/pkg/log"
)

// GetConfiguration : Populate configuration information from .env and return Configuration model
func GetConfiguration[T any]() (*T, error) {
	_ = godotenv.Load("./.env")

	var conf T
	if err := envconfig.Process("", &conf); err != nil {
		log.WithError(err).Error("failed to load configuration")
		return nil, err
	}

	return &conf, nil
}
