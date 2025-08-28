// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"time"
)

type KeyStoreType string

const (
	KeyStoreTypeVault KeyStoreType = "vault"
	KeyStoreTypeAwsSm KeyStoreType = "awssm"
)

//nolint:lll // Ignore linting for long lines
type Configuration struct {
	ServerHttpHost                                          string        `split_words:"true" default:":4000"`
	ServerGrpcHost                                          string        `split_words:"true" default:":4001"`
	ApiUrl                                                  string        `split_words:"true" default:"http://localhost:4000"`
	GoEnv                                                   string        `split_words:"true" default:"production"`
	LogLevel                                                string        `split_words:"true" default:"InfoLevel"`
	SecretsCryptoKey                                        string        `split_words:"true" default:"secretkey"`
	DbHost                                                  string        `split_words:"true"                                              required:"true"`
	DbPort                                                  string        `split_words:"true"                                              required:"true"`
	DbName                                                  string        `split_words:"true" default:"identity"`
	DbUsername                                              string        `split_words:"true"                                              required:"true"`
	DbPassword                                              string        `split_words:"true"                                              required:"true"`
	DbUseSsl                                                bool          `split_words:"true" default:"false"`
	KeyStoreType                                            KeyStoreType  `split_words:"true" default:"vault"`
	VaultHost                                               string        `split_words:"true" default:"0.0.0.0"`
	VaultPort                                               string        `split_words:"true" default:"8200"`
	VaultUseSsl                                             bool          `split_words:"true" default:"false"`
	AwsRegion                                               string        `split_words:"true"`
	IdentityHost                                            string        `split_words:"true" default:"0.0.0.0"`
	IdentityPort                                            string        `split_words:"true" default:"4003"`
	IamProductID                                            string        `split_words:"true"                                              required:"true"`
	IamApiUrl                                               string        `split_words:"true"                                              required:"true"`
	IamAdminAPIKey                                          string        `split_words:"true"`
	IamIssuer                                               string        `split_words:"true"`
	IamUserCid                                              string        `split_words:"true"`
	IamApiKeyCid                                            string        `split_words:"true"`
	IamSingleTenantID                                       string        `split_words:"true" default:"000000-0000-0000-0000-000000000000"`
	IamMultiTenant                                          bool          `split_words:"true" default:"true"`
	WebApprovalEmail                                        string        `split_words:"true"                                              required:"true"`
	WebApprovalPubKey                                       string        `split_words:"true"                                              required:"true"`
	WebApprovalPrivKey                                      string        `split_words:"true"                                              required:"true"`
	UniqueIssuerPerTenant                                   bool          `split_words:"true" default:"true"`
	ServerGrpcKeepAliveEnvorcementPolicyMinTime             int           `split_words:"true" default:"300"`
	ServerGrpcKeepAliveEnforcementPolicyPermitWithoutStream bool          `split_words:"true" default:"false"`
	ServerGrpcKeepAliveServerParametersMaxConnectionIdle    int           `split_words:"true" default:"100"`
	ServerGrpcKeepAliveServerParametersTime                 int           `split_words:"true" default:"7200"`
	ServerGrpcKeepAliveServerParametersTimeout              int           `split_words:"true" default:"20"`
	ClientGrpcKeepAliveClientParametersTime                 int           `split_words:"true" default:"100"`
	ClientGrpcKeepAliveClientParametersTimeout              int           `split_words:"true" default:"20"`
	ClientGrpcKeepAliveClientParametersPermitWithoutStream  bool          `split_words:"true" default:"false"`
	HttpServerWriteTimeout                                  int           `split_words:"true" default:"100"`
	HttpServerIdleTimeout                                   int           `split_words:"true" default:"100"`
	HttpServerReadTimeout                                   int           `split_words:"true" default:"100"`
	HttpServerReadHeaderTimeout                             int           `split_words:"true" default:"100"`
	DefaultCallTimeout                                      time.Duration `split_words:"true" default:"10000ms"`
}

func (c *Configuration) IsProd() bool {
	return c.GoEnv == "production"
}

func (c *Configuration) IsDev() bool {
	return c.GoEnv == "development"
}
