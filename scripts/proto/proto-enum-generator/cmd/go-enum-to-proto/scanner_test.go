// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"fmt"
	"proto-enum-generator/pkg/types"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEnumScanner(t *testing.T) {
	scanner := NewEnumScanner()
	scanner.Packages = "go-enums-test/data,go-enums-test/data/data2"
	scanner.GoModulePath = "testdata"

	err := scanner.Scan()

	assert.Nil(t, err)
	assert.Len(t, scanner.enums, 2)

	enums := make(map[string]*types.Enum)
	for _, enum := range scanner.enums {
		fn := strings.Trim(fmt.Sprintf("%s.%s", enum.Name.Package, enum.Name.Name), ".")
		enums[fn] = enum
	}

	assert.Contains(t, enums, "go-enums-test/data.Enum")
	assert.Contains(t, enums, "go-enums-test/data/data2.Enum2")
	assert.Contains(t, enums["go-enums-test/data.Enum"].Position.Filename, "testdata/data/enum.go")
	assert.Equal(t, 8, enums["go-enums-test/data.Enum"].Position.Line)
	assert.Contains(t, enums["go-enums-test/data/data2.Enum2"].Position.Filename, "testdata/data/data2/enum.go")
	assert.Equal(t, 3, enums["go-enums-test/data/data2.Enum2"].Position.Line)
	assert.Len(t, enums["go-enums-test/data.Enum"].Values, 2)
	assert.Len(t, enums["go-enums-test/data/data2.Enum2"].Values, 2)
	assert.Equal(t, 14, enums["go-enums-test/data.Enum"].Values[0].Position.Line)
	assert.Equal(t, 15, enums["go-enums-test/data.Enum"].Values[1].Position.Line)
	assert.Equal(t, 6, enums["go-enums-test/data/data2.Enum2"].Values[0].Position.Line)
	assert.Equal(t, 7, enums["go-enums-test/data/data2.Enum2"].Values[1].Position.Line)
}

func TestComments(t *testing.T) {
	scanner := NewEnumScanner()
	scanner.Packages = "go-enums-test/data,go-enums-test/data/data2"
	scanner.GoModulePath = "testdata"

	err := scanner.Scan()

	assert.Nil(t, err)

	var enumWithComment *types.Enum
	for _, enum := range scanner.enums {
		fn := strings.Trim(fmt.Sprintf("%s.%s", enum.Name.Package, enum.Name.Name), ".")
		if strings.EqualFold(fn, "go-enums-test/data.Enum") {
			enumWithComment = enum
			break
		}
	}
	assert.NotNil(t, enumWithComment)

	assert.NotNil(t, enumWithComment.Comment)
	assert.Len(t, enumWithComment.Comment.List, 1)
	assert.Equal(t, "// enum comment", enumWithComment.Comment.List[0])
	assert.Equal(t, 7, enumWithComment.Comment.Position.Line)
	assert.Contains(t, enumWithComment.Comment.Position.Filename, "testdata/data/enum.go")

	enumValueWithComment := enumWithComment.Values[0]
	assert.Len(t, enumValueWithComment.Comment.List, 3)
	assert.Equal(t, "// Const comment", enumValueWithComment.Comment.List[0])
	assert.Equal(t, "//", enumValueWithComment.Comment.List[1])
	assert.Equal(t, "// it ends here", enumValueWithComment.Comment.List[2])
	assert.Equal(t, 11, enumValueWithComment.Comment.Position.Line)
	assert.Contains(t, enumValueWithComment.Comment.Position.Filename, "testdata/data/enum.go")
}

func TestEnumGeneration(t *testing.T) {
	scanner := NewEnumScanner()
	scanner.Packages = "go-enums-test/data,go-enums-test/data/data2"
	scanner.GoModulePath = "testdata"

	err := scanner.Scan()

	assert.Nil(t, err)

	protos, err := scanner.GenerateProtos(false)

	assert.Nil(t, err)
	assert.Len(t, protos, 2)

	outs := make(map[string]*types.ProtoOutput)
	for _, proto := range protos {
		fn := strings.Trim(fmt.Sprintf("%s.%s", proto.Enum.Name.Package, proto.Enum.Name.Name), ".")
		outs[fn] = proto
	}

	assert.Equal(t, `// enum comment
enum Enum {
  // Const comment
  //
  // it ends here
  Enum_VALUE_1 = 0;
  Enum_VALUE_2 = 1;
}
`,
		outs["go-enums-test/data.Enum"].Proto,
	)
	assert.Equal(t, `enum Enum2 {
  EV1 = 0;
  EV2 = 1;
}
`,
		outs["go-enums-test/data/data2.Enum2"].Proto,
	)
}
