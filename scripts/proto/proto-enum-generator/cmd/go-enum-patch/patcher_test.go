// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

var regex = regexp.MustCompile(`\n{3,}`)

func TestGoPatch(t *testing.T) {
	assert.Nil(t, startup("go"))
	defer cleanup()

	p := NewGoPatcher("testdata/enums.json")

	err := p.Patch()

	assert.Nil(t, err)
	assertFileContent(
		t,
		"testdata/data/enum_copy.go",
		`
package data

type Enum struct{}

const (

)

type Enum3 struct{}

const (
)
		`,
	)
	assertFileContent(
		t,
		"testdata/data/another_copy.go",
		`
package data

type Enum4 struct{}

const (
)
		`,
	)
	assertFileContent(
		t,
		"testdata/data/data2/enum_copy.go",
		`
package data2

type Enum2 struct{}

const (
)
		`,
	)
}

func TestProtoPatch(t *testing.T) {
	assert.Nil(t, startup("proto"))
	defer cleanup()

	p := NewProtoPatcher("testdata/enums.json", "generated_copy.proto")

	err := p.Patch()

	assert.Nil(t, err)
	assertFileContent(
		t,
		"testdata/data/generated_copy.proto",
		`
syntax = "proto3";

package data;

enum Enum3 {
  Enum3_V1 = 0;
  Enum3_V2 = 1;
  Enum3_V3 = 2;
}

enum Enum4 {
  Enum4_V1 = 0;
  Enum4_V2 = 1;
}

// enum comment
enum Enum {
  // Const comment
  //
  // it ends here
  Enum_VALUE_1 = 0;
  // Const comment for value 2
  Enum_VALUE_2 = 1;
}
		`,
	)
	assertFileContent(
		t,
		"testdata/data/data2/generated_copy.proto",
		`
syntax = "proto3";

package data.data2;

message Ignored {}

enum Enum2 {
  EV1 = 0;
  EV2 = 1;
}
		`,
	)
}

func assertFileContent(t *testing.T, path string, expected string) {
	data, err := os.ReadFile(path)
	assert.Nil(t, err)

	assert.Equal(t, formatContent(expected), formatContent(string(data)))
}

func formatContent(s string) string {
	result := strings.Trim(s, "\n\t")

	result = string(regex.ReplaceAll([]byte(result), []byte("\n\n")))
	return result
}

func startup(extToRename string) error {
	path := "testdata"

	return filepath.Walk(
		path,
		func(path string, info fs.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if strings.Contains(path, "."+extToRename) {
				fnNoExt := strings.Split(info.Name(), ".")[0]
				newPath := filepath.Join(filepath.Dir(path), fmt.Sprintf("%s_copy.%s", fnNoExt, extToRename))
				return copyFile(path, newPath)
			}

			return nil
		},
	)
}

func copyFile(srcpath, dstpath string) error {
	r, err := os.Open(srcpath)
	if err != nil {
		return err
	}
	defer r.Close()

	w, err := os.Create(dstpath)
	if err != nil {
		return err
	}

	defer w.Close()

	_, err = io.Copy(w, r)
	return err
}

func cleanup() {
	filepath.Walk(
		"testdata",
		func(path string, info fs.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if strings.Contains(path, "_copy") {
				return os.Remove(path)
			}

			return nil
		},
	)
}
