// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"proto-enum-generator/pkg/types"
)

func ParsePatchFile(path string) ([]*types.ProtoOutput, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("unable to read patch file: %w", err)
	}

	var enums []*types.ProtoOutput

	err = json.Unmarshal(data, &enums)
	if err != nil {
		return nil, err
	}

	return enums, nil
}
