// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package log

import (
	"os"

	"github.com/sirupsen/logrus"
)

// Commonly used field names here
const (
	ErrorField string = "error"
)

func Init(_ string) {
	logrus.SetOutput(os.Stdout)

	formatter := &logrus.TextFormatter{
		FullTimestamp:          true,
		DisableLevelTruncation: true,
	}

	logrus.SetFormatter(formatter)
}

// SetLogLevel : Configure log level
func SetLogLevel(aLogLevel string) {
	// Set log level
	logLevel := logrus.InfoLevel
	if aLogLevel == "DebugLevel" {
		logLevel = logrus.DebugLevel
	}

	logrus.SetLevel(logLevel)
}

// Info : Configure log level
func Info(args ...interface{}) {
	logrus.Info(args...)
}

// Debug : Configure log level
func Debug(args ...interface{}) {
	logrus.Debug(args...)
}

// Fatal : Configure log level
func Fatal(args ...interface{}) {
	logrus.Fatal(args...)
}

// Error : Configure log level
func Error(args ...interface{}) {
	logrus.Error(args...)
}

func Warn(args ...interface{}) {
	logrus.Warn(args...)
}

func WithFields(fields logrus.Fields) *logrus.Entry {
	return logrus.WithFields(fields)
}
