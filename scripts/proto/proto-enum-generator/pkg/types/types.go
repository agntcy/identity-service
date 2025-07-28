// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package types

import "go/token"

type CommentGroup struct {
	List     []string
	Position token.Position
}

type EnumValue struct {
	Name     string
	Value    int
	Position token.Position
	Comment  *CommentGroup
}

type Name struct {
	Package string
	Name    string
}

type Enum struct {
	Name     Name
	Values   []*EnumValue
	Path     string
	Position token.Position
	Comment  *CommentGroup
}

func (e *Enum) AddValue(value *EnumValue) {
	e.Values = append(e.Values, value)
}

type ProtoOutput struct {
	Enum  *Enum
	Proto string
}
