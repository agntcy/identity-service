// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package cmd

import (
	"github.com/agntcy/identity-service/pkg/log"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/sirupsen/logrus"
)

// GetConfiguration : Populate configuration information from .env and return Configuration model
func GetConfiguration[T any]() (*T, error) {
	_ = godotenv.Load("./.env")

	var conf T
	if err := envconfig.Process("", &conf); err != nil {
		log.WithFields(logrus.Fields{log.ErrorField: err}).Error("failed to load configuration")
		return nil, err
	}

	return &conf, nil
}
