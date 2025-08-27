// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package db

import (
	"fmt"
	golog "log"
	"os"
	"time"

	"github.com/outshift/identity-service/pkg/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Context interface {
	Connect() error
	Client() *gorm.DB
	AutoMigrate(types ...interface{}) error
	Disconnect() error
}

type context struct {
	host     string
	port     string
	name     string
	username string
	password string
	useSSL   bool
	client   *gorm.DB
}

func NewContext(host, port, name, username, password string, useSSL bool) Context {
	return &context{
		host:     host,
		port:     port,
		name:     name,
		username: username,
		password: password,
		useSSL:   useSSL,
	}
}

// Connect to the database using the provided parameters
func (d *context) Connect() error {
	// Check SSL
	sslMode := "disable"
	if d.useSSL {
		sslMode = "require" // https://www.postgresql.org/docs/current/libpq-ssl.html#LIBPQ-SSL-PROTECTION
	}

	// Set dsn
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		d.host, d.username, d.password, d.name, d.port, sslMode,
	)

	log.Debug("Connecting to DB:", dsn)

	newLogger := logger.New(
		golog.New(os.Stdout, "\r\n", golog.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Millisecond * 0, // Slow SQL threshold
			LogLevel:                  logger.Info,          // Log level
			IgnoreRecordNotFoundError: true,                 // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      false,                // Don't include params in the SQL log
			Colorful:                  true,                 // Disable color
		},
	)

	client, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: newLogger})
	if err != nil {
		return err
	}

	// Set client
	d.client = client

	return nil
}

// Client returns the database client
func (d *context) Client() *gorm.DB {
	if d.client == nil {
		log.Fatal("DB client is not initialized")
	}

	return d.client
}

// AutoMigrate performs auto migration for the given models
func (d *context) AutoMigrate(types ...interface{}) error {
	// Perform auto migration
	return d.client.AutoMigrate(types...)
}

// Disconnect from the database instance
func (d *context) Disconnect() error {
	dbInstance, _ := d.client.DB()
	if err := dbInstance.Close(); err != nil {
		return err
	}

	return nil
}
