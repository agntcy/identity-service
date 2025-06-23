// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

// Identity Platform Token
type Token struct {
	// A unique identifier for the Token.
	ID string `json:"id,omitempty" protobuf:"bytes,1,opt,name=id"`

	// Token value.
	Value string `json:"value,omitempty" protobuf:"bytes,2,opt,name=value"`
}
