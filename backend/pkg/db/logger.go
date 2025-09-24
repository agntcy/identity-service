// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package db

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/outshift/identity-service/pkg/log"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/utils"
)

const (
	nanosecsInMillisec = 1e6
)

type logrusLogger struct{}

func NewLogrusLogger() logger.Interface {
	return &logrusLogger{}
}

func (l *logrusLogger) Error(ctx context.Context, msg string, data ...any) {
	log.FromContext(ctx).Errorf(msg, data...)
}

func (l *logrusLogger) Info(ctx context.Context, msg string, data ...any) {
	log.FromContext(ctx).Infof(msg, data...)
}

func (l *logrusLogger) Warn(ctx context.Context, msg string, data ...any) {
	log.FromContext(ctx).Infof(msg, data...)
}

func (l *logrusLogger) LogMode(logger.LogLevel) logger.Interface {
	// No need to implement this
	return l
}

func (l *logrusLogger) Trace(
	ctx context.Context,
	begin time.Time,
	fc func() (sql string, rowsAffected int64),
	err error,
) {
	elapsed := time.Since(begin)

	sql, rows := fc()
	rowsStr := fmt.Sprintf("%v", rows)

	if rows == -1 {
		rowsStr = "-"
	}

	logEntry := log.FromContext(ctx)

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logEntry = logEntry.WithError(err)
	}

	logEntry.Infof(
		"%s\n[%.3fms] [rows:%s] %s",
		utils.FileWithLineNum(),
		float64(elapsed.Nanoseconds())/nanosecsInMillisec,
		rowsStr,
		sql,
	)
}
