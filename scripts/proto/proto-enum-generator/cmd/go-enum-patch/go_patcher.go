// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"errors"
	"fmt"
	"proto-enum-generator/pkg/files"
	"proto-enum-generator/pkg/types"
)

type GoPatcher struct {
	PatchPath string
}

func NewGoPatcher(path string) *GoPatcher {
	return &GoPatcher{
		PatchPath: path,
	}
}

func (p *GoPatcher) Patch() error {
	if p.PatchPath == "" {
		return errors.New("please specify the enums JSON file")
	}

	enums, err := ParsePatchFile(p.PatchPath)
	if err != nil {
		return err
	}

	groupedEnums := map[string][]*types.Enum{}

	for _, enum := range enums {
		path := enum.Enum.Path
		groupedEnums[path] = append(groupedEnums[path], enum.Enum)
	}

	for path, ee := range groupedEnums {
		err := p.patchGoEnum(path, ee)
		if err != nil {
			return err
		}
	}

	return nil
}

func (p *GoPatcher) patchGoEnum(path string, enums []*types.Enum) error {
	file, err := files.Open(path)
	if err != nil {
		return err
	}

	for _, enum := range enums {
		file.ReplaceLine(enum.Position.Line, fmt.Sprintf("type %s struct{}", enum.Name.Name))
		p.removeComments(file, enum.Comment)

		for _, value := range enum.Values {
			file.RemoveLine(value.Position.Line)
			p.removeComments(file, value.Comment)
		}
	}

	err = file.Flush()
	if err != nil {
		return fmt.Errorf(
			"unable to patch enums in Go file [%s]: %w",
			path,
			err,
		)
	}

	return nil
}

func (p *GoPatcher) removeComments(file *files.File, comment *types.CommentGroup) {
	if comment == nil || len(comment.List) == 0 {
		return
	}

	for i := comment.Position.Line; i < comment.Position.Line+len(comment.List); i++ {
		file.RemoveLine(i)
	}
}
