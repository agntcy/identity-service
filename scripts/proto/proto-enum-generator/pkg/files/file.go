// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package files

import (
	"bufio"
	"errors"
	"fmt"
	"os"
)

type FileOperation interface{}

type FileOperationReplace struct {
	NewText string
}

type FileOperationRemove struct{}

type FileOperationAppend struct {
	Text string
}

type File struct {
	Path    string
	file    *os.File
	ops     map[int][]FileOperation
	appends []*FileOperationAppend
}

func Open(path string) (*File, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	return &File{
		Path: path,
		file: file,
		ops:  map[int][]FileOperation{},
	}, nil
}

func (f *File) Flush() error {
	if f.file == nil {
		return errors.New("file not opened")
	}

	swpFilePath := fmt.Sprintf("%s_swp", f.file.Name())

	swpFile, err := os.Create(swpFilePath)
	if err != nil {
		return err
	}

	defer f.file.Close()
	defer swpFile.Close()

	line := 0
	scanner := bufio.NewScanner(f.file)
	writer := bufio.NewWriter(swpFile)

	for scanner.Scan() {
		line++
		text := scanner.Text()

		if ops, ok := f.ops[line]; ok {
			for _, op := range ops {
				switch op := op.(type) {
				case FileOperationReplace:
					_, _ = writer.WriteString(op.NewText + "\n")
				case FileOperationRemove:
					continue
				default:
					_, _ = writer.WriteString(text + "\n")
				}
			}
		} else {
			_, _ = writer.WriteString(text + "\n")
		}
	}

	for _, ap := range f.appends {
		_, _ = writer.WriteString(ap.Text + "\n")
	}

	err = writer.Flush()
	if err != nil {
		return err
	}

	f.file.Close()
	swpFile.Close()

	err = os.Remove(f.file.Name())
	if err != nil {
		return err
	}

	return os.Rename(swpFilePath, f.Path)
}

func (f *File) ReplaceLine(line int, text string) {
	f.ops[line] = append(f.ops[line], FileOperationReplace{NewText: text})
}

func (f *File) RemoveLine(line int) {
	f.ops[line] = append(f.ops[line], FileOperationRemove{})
}

func (f *File) Append(text string) {
	f.appends = append(f.appends, &FileOperationAppend{Text: text})
}
