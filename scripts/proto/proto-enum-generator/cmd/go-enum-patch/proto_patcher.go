// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"proto-enum-generator/pkg/files"
	"proto-enum-generator/pkg/types"
	"slices"

	"github.com/yoheimuta/go-protoparser/v4"
	"github.com/yoheimuta/go-protoparser/v4/parser"
)

type ProtoPatcher struct {
	PatchPath     string
	ProtoFileName string
}

func NewProtoPatcher(
	patchPath string,
	protoFileName string,
) *ProtoPatcher {
	return &ProtoPatcher{
		PatchPath:     patchPath,
		ProtoFileName: protoFileName,
	}
}

func (p *ProtoPatcher) Patch() error {
	if p.PatchPath == "" {
		return errors.New("please specify the enums JSON file")
	}

	enums, err := ParsePatchFile(p.PatchPath)
	if err != nil {
		return err
	}

	groupedEnums := map[string][]*types.ProtoOutput{}

	for _, enum := range enums {
		pkg := filepath.Dir(enum.Enum.Path)
		groupedEnums[pkg] = append(groupedEnums[pkg], enum)
	}

	for pkg, ee := range groupedEnums {
		err := p.patchProtoFile(pkg, ee)
		if err != nil {
			return err
		}
	}

	return nil
}

func (p *ProtoPatcher) patchProtoFile(pkg string, enums []*types.ProtoOutput) error {
	protoFilePath := filepath.Join(pkg, p.ProtoFileName)

	if _, err := os.Stat(protoFilePath); errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("proto file %s does not exist", protoFilePath)
	}

	enumNames := []string{}
	for _, enum := range enums {
		enumNames = append(enumNames, enum.Enum.Name.Name)
	}

	positions, err := p.parseProtoFile(protoFilePath, enumNames)
	if err != nil {
		return err
	}

	file, err := files.Open(protoFilePath)
	if err != nil {
		return err
	}

	for _, enum := range enums {
		pos, ok := positions[enum.Enum.Name.Name]
		if !ok {
			continue
		}

		for i := pos.Start; i <= pos.End; i++ {
			file.RemoveLine(i)
		}

		file.Append(enum.Proto)
	}

	return file.Flush()
}

type enumPosition struct {
	Name  string
	Start int
	End   int
}

func (p *ProtoPatcher) parseProtoFile(
	path string,
	enums []string,
) (map[string]*enumPosition, error) {
	reader, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	defer reader.Close()

	proto, err := protoparser.Parse(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to parse proto: %w", err)
	}

	positions := make(map[string]*enumPosition)

	for _, item := range proto.ProtoBody {
		msg, ok := item.(*parser.Message)
		if !ok {
			continue
		}

		if slices.Contains(enums, msg.MessageName) {
			positions[msg.MessageName] = &enumPosition{
				Name:  msg.MessageName,
				Start: msg.Meta.Pos.Line,
				End:   msg.Meta.LastPos.Line,
			}
		}
	}

	return positions, nil
}
