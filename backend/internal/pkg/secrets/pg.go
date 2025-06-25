// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package secrets

import (
	"context"
	"fmt"
	"reflect"

	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/pkg/log"
	"gorm.io/gorm/schema"
)

type EncryptedString string

func FromString(s *string) *EncryptedString {
	if s == nil {
		return nil
	}

	return ptrutil.Ptr(EncryptedString(*s))
}

func ToString(es *EncryptedString) *string {
	if es == nil {
		return nil
	}

	s := string(*es)
	if s == "" {
		return nil
	}

	return ptrutil.Ptr(s)
}

// ctx: contains request-scoped values
// field: the field using the serializer, contains GORM settings, struct tags
// dst: current model value, `user` in the below example
// dbValue: current field's value in database
func (es *EncryptedString) Scan(
	ctx context.Context,
	field *schema.Field,
	dst reflect.Value,
	dbValue interface{},
) error {
	log.Debug("Using EncryptedString Scan method")

	if dbValue == nil {
		return nil
	}

	switch value := dbValue.(type) {
	case []byte:
		*es = EncryptedString(Decrypt(string(value)))
	case string:
		*es = EncryptedString(Decrypt(value))
	default:
		return errutil.Err(
			fmt.Errorf("unsupported data type %T: %v", dbValue, dbValue),
			"failed to scan encrypted string",
		)
	}

	return nil
}

// ctx: contains request-scoped values
// field: the field using the serializer, contains GORM settings, struct tags
// dst: current model value, `user` in the below example
// fieldValue: current field's value of the dst
func (es *EncryptedString) Value(
	ctx context.Context,
	field *schema.Field,
	dst reflect.Value,
	fieldValue interface{},
) (interface{}, error) {
	if es == nil {
		//nolint: nilnil // If the EncryptedString is nil, return nil to avoid storing an empty string
		return nil, nil
	}

	return Encrypt(string(*es)), nil
}
