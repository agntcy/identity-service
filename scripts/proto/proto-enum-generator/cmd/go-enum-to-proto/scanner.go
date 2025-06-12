// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"go/ast"
	"go/constant"
	"go/token"
	gotypes "go/types"
	"log"
	"os"
	"path"
	"proto-enum-generator/pkg/types"
	"sort"
	"strconv"
	"strings"

	flag "github.com/spf13/pflag"
	"golang.org/x/tools/go/packages"
)

const filePermissions = 0o644
const nameLength = 2

type PackageCol struct {
	Pkgs []*packages.Package
	Fset *token.FileSet
}

type EnumScanner struct {
	Packages     string
	GoModulePath string
	OutputDir    string
	enums        []*types.Enum
	fset         *token.FileSet
	// All comments from everywhere in every parsed file.
	endLineToCommentGroup map[fileLine]*ast.CommentGroup
}

// key type for finding comments.
type fileLine struct {
	file string
	line int
}

func NewEnumScanner() *EnumScanner {
	return &EnumScanner{
		enums:                 []*types.Enum{},
		endLineToCommentGroup: map[fileLine]*ast.CommentGroup{},
	}
}

func (s *EnumScanner) BindFlags(flag *flag.FlagSet) {
	flag.StringVarP(
		&s.Packages,
		"packages",
		"p",
		s.Packages,
		"comma-separated list of directories to get input enums from.",
	)
	flag.StringVar(
		&s.GoModulePath,
		"go-mod-path",
		s.Packages,
		"The path containing the go.mod for the specified packages.",
	)
	flag.StringVarP(
		&s.OutputDir,
		"output-dir",
		"o",
		s.OutputDir,
		"The base directory under which to generate results.",
	)
}

func (s *EnumScanner) Scan() error {
	packages := strings.Split(s.Packages, ",")
	if s.Packages == "" || len(packages) == 0 {
		return errors.New("packages is empty. At least one package must be specified")
	}

	pkgs, err := s.loadPackages(packages)
	if err != nil {
		return fmt.Errorf("unable to load packages: %w", err)
	}

	s.fset = pkgs.Fset

	for _, pkg := range pkgs.Pkgs {
		s.scanPkg(pkg)
	}

	for _, enum := range s.enums {
		sort.Sort(enumByValue(enum.Values))
	}

	return nil
}

func (s *EnumScanner) GenerateProtos(writeToFile bool) ([]*types.ProtoOutput, error) {
	outs := make([]*types.ProtoOutput, len(s.enums))

	for i, enum := range s.enums {
		var buf bytes.Buffer

		s.generateProtoComments(&buf, enum.Comment, "")
		buf.WriteString(fmt.Sprintf("enum %s {\n", enum.Name.Name))

		for _, value := range enum.Values {
			s.generateProtoComments(&buf, value.Comment, "  ")
			buf.WriteString(fmt.Sprintf("  %s = %d", value.Name, value.Value))
			buf.WriteString(";\n")
		}

		buf.WriteString("}\n")
		outs[i] = &types.ProtoOutput{
			Enum:  enum,
			Proto: buf.String(),
		}
	}

	if writeToFile {
		data, err := json.MarshalIndent(outs, "", " ")
		if err != nil {
			return nil, fmt.Errorf("unable to marshal the output: %w", err)
		}

		err = os.WriteFile(path.Join(s.OutputDir, "enums.json"), data, filePermissions)
		if err != nil {
			return nil, fmt.Errorf("unable to write the output: %w", err)
		}
	}

	return outs, nil
}

func (s *EnumScanner) generateProtoComments(
	buf *bytes.Buffer,
	comment *types.CommentGroup,
	prefix string,
) {
	if comment != nil {
		for _, c := range comment.List {
			fmt.Fprintf(buf, "%s%s\n", prefix, c)
		}
	}
}

func (s *EnumScanner) loadPackages(names []string) (*PackageCol, error) {
	fset := token.NewFileSet()
	cfg := packages.Config{
		Mode: packages.NeedName |
			packages.NeedFiles | packages.NeedImports | packages.NeedDeps |
			packages.NeedModule | packages.NeedTypes | packages.NeedSyntax,
		Fset:  fset,
		Tests: false,
		Dir:   s.GoModulePath,
	}

	pkgs, err := packages.Load(&cfg, names...)
	if err != nil {
		return nil, err
	}

	log.Printf("Packages [%s] loaded.\n", strings.Join(names, ", "))

	return &PackageCol{
		Pkgs: pkgs,
		Fset: fset,
	}, nil
}

func (s *EnumScanner) scanPkg(pkg *packages.Package) {
	log.Printf("Scanning package %s\n", pkg.Name)

	s.addComments(pkg)

	scope := pkg.Types.Scope()
	for _, n := range scope.Names() {
		ct, ok := scope.Lookup(n).(*gotypes.Const)
		if ok {
			if nt, ok := ct.Type().(*gotypes.Named); ok {
				if bt, ok := ct.Type().Underlying().(*gotypes.Basic); ok {
					s.addEnumValue(ct, nt, bt)
				}
			}
		}
	}
}

func (s *EnumScanner) addComments(pkg *packages.Package) {
	for _, file := range pkg.Syntax {
		for _, comment := range file.Comments {
			pos := s.fset.Position(comment.End())
			key := fileLine{file: pos.Filename, line: pos.Line}
			s.endLineToCommentGroup[key] = comment
		}
	}
}

func (s *EnumScanner) getObjectComment(obj gotypes.Object) *ast.CommentGroup {
	position := s.fset.Position(obj.Pos())
	key := fileLine{file: position.Filename, line: position.Line - 1}

	return s.endLineToCommentGroup[key]
}

func (s *EnumScanner) getEnum(name types.Name) *types.Enum {
	for _, enum := range s.enums {
		if enum.Name.Name == name.Name &&
			enum.Name.Package == name.Package {
			return enum
		}
	}

	return nil
}

func (s *EnumScanner) addEnum(enum *types.Enum) {
	s.enums = append(s.enums, enum)
}

func (s *EnumScanner) addEnumValue(ct *gotypes.Const, nt *gotypes.Named, bt *gotypes.Basic) {
	// String enums are not supported in protobuf spec
	if bt.String() == "string" {
		return
	}

	typName := s.goNameToName(nt.String())

	enum := s.getEnum(typName)
	if enum == nil {
		pos := s.fset.Position(nt.Obj().Pos())
		comment := s.getObjectComment(nt.Obj())
		enum = &types.Enum{
			Name:     typName,
			Values:   []*types.EnumValue{},
			Path:     pos.Filename,
			Position: pos,
			Comment:  s.convertCommentGroup(comment),
		}
		s.addEnum(enum)

		log.Printf("Found enum %s at %s:%d\n", typName.Name, pos.Filename, pos.Line)
	}

	var val int

	if ct.Val().Kind() == constant.Int {
		v, err := strconv.Atoi(ct.Val().String())
		if err != nil {
			// can this happen?
			val = 0
		} else {
			val = v
		}
	}

	comment := s.getObjectComment(ct)

	enum.AddValue(&types.EnumValue{
		Name:     ct.Name(),
		Value:    val,
		Position: s.fset.Position(ct.Pos()),
		Comment:  s.convertCommentGroup(comment),
	})

	log.Printf("Added new value (%s = %d) to enum %s\n", ct.Name(), val, typName.Name)
}

func (s *EnumScanner) convertCommentGroup(c *ast.CommentGroup) *types.CommentGroup {
	if c == nil {
		return nil
	}

	list := []string{}
	for _, t := range c.List {
		list = append(list, t.Text)
	}

	return &types.CommentGroup{
		List:     list,
		Position: s.fset.Position(c.Pos()),
	}
}

// goNameToName converts a go name string to a Name struct.
func (s *EnumScanner) goNameToName(in string) types.Name {
	// Detect anonymous type names. (These may have '.' characters because
	// embedded types may have packages, so we detect them specially.)
	if strings.HasPrefix(in, "struct{") ||
		strings.HasPrefix(in, "<-chan") ||
		strings.HasPrefix(in, "chan<-") ||
		strings.HasPrefix(in, "chan ") ||
		strings.HasPrefix(in, "func(") ||
		strings.HasPrefix(in, "func (") ||
		strings.HasPrefix(in, "*") ||
		strings.HasPrefix(in, "map[") ||
		strings.HasPrefix(in, "[") {
		return types.Name{Name: in}
	}

	// There may be '.' characters within a generic. Temporarily remove
	// the generic.
	genericIndex := strings.IndexRune(in, '[')
	if genericIndex == -1 {
		genericIndex = len(in)
	}

	// Otherwise, if there are '.' characters present, the name has a
	// package path in front.
	nameParts := strings.Split(in[:genericIndex], ".")
	name := types.Name{Name: in}

	if n := len(nameParts); n >= nameLength {
		// The final "." is the name of the type--previous ones must
		// have been in the package path.
		name.Package, name.Name = strings.Join(nameParts[:n-1], "."), nameParts[n-1]
		// Add back the generic component now that the package and type name have been separated.
		if genericIndex != len(in) {
			name.Name += in[genericIndex:]
		}
	}

	return name
}

type enumByValue []*types.EnumValue

func (s enumByValue) Len() int           { return len(s) }
func (s enumByValue) Swap(i, j int)      { s[i], s[j] = s[j], s[i] }
func (s enumByValue) Less(i, j int) bool { return s[i].Value < s[j].Value }
