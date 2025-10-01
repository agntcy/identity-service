// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package converters_test

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"reflect"
	"runtime"
	"strings"
	"testing"

	"github.com/agntcy/identity-service/internal/bff/grpc/converters"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/stretchr/testify/assert"
)

var testData []any = []any{
	converters.FromApiKey,
	converters.FromApp,
	converters.FromBadge,
	converters.FromBadgeClaims,
	converters.FromCredentialSchema,
	converters.FromCredentialStatus,
	converters.FromDevice,
	converters.FromErrorInfo,
	converters.FromIssuerSettings,
	converters.FromPolicy,
	converters.FromProof,
	converters.FromRule,
	converters.FromTask,
	converters.FromVerifiableCredential,
	converters.FromVerificationResult,
	converters.ToApp,
	converters.ToDevice,
	converters.ToOktaIdpSettings,
	converters.ToDuoIdpSettings,
	converters.ToOryIdpSettings,
	converters.ToIssuerSettings,
}

type ConverterData struct {
	Func    reflect.Value
	SrcType reflect.Type
	Fields  []string
}

// A visitor that finds the body of a function
type FindBlockByFuncName struct {
	Fset     *token.FileSet
	Line     int
	Block    *ast.BlockStmt
	FuncName string
}

func (f *FindBlockByFuncName) Visit(node ast.Node) ast.Visitor {
	if node == nil {
		return nil
	}

	if file, ok := node.(*ast.File); ok {
		if obj, ok := file.Scope.Objects[f.FuncName]; ok {
			if funcDecl, ok := obj.Decl.(*ast.FuncDecl); ok {
				stmtLine := f.Fset.Position(funcDecl.Pos()).Line
				if stmtLine == f.Line {
					f.Block = funcDecl.Body
					return nil
				}
			}
		}
	}

	return f
}

// Returns the function name from its pointer. It only returns
// the name without the pkg path and the filename.
func getFuncName(t *testing.T, fn any) string {
	t.Helper()

	fp := reflect.ValueOf(fn).Pointer()
	fc := runtime.FuncForPC(fp)
	fnNameParts := strings.Split(fc.Name(), ".")

	return fnNameParts[len(fnNameParts)-1]
}

// Returns the output fields being populated by the converter.
// For example if we have a converter that looks like this:
//
//	  func FromApp(src *apptypes.App) *identity_service_sdk_go.App {
//	    ...some code...
//		   return &identity_service_sdk_go.App{
//			   Id:                 ptrutil.Ptr(src.ID),
//			   Name:               src.Name,
//			   Description:        src.Description,
//		   }
//	  }
//
// Then this function will return the following slice: []string{"Id", "Name", "Description"}
//
//nolint:gocognit // I don't think the conditions are that hard to understand
func parseOutputTypeFields(block *ast.BlockStmt) []string {
	fields := make([]string, 0)

	for _, stmt := range block.List {
		retStmt, ok := stmt.(*ast.ReturnStmt)
		if !ok {
			continue
		}

		for _, expr := range retStmt.Results {
			if unaryExpr, ok := expr.(*ast.UnaryExpr); ok {
				if composite, ok := unaryExpr.X.(*ast.CompositeLit); ok {
					for _, ele := range composite.Elts {
						if keyValExpr, ok := ele.(*ast.KeyValueExpr); ok {
							if ident, ok := keyValExpr.Key.(*ast.Ident); ok {
								fields = append(fields, ident.Name)
							}
						}
					}
				}
			}
		}
	}

	return fields
}

// This function takes as input a pointer to a converter function, it uses
// ast and reflection to parse its source code to return the argument type (src),
// the return type (dst) and the fields of the return type being populated.
func parseConverter(t *testing.T, converter any) *ConverterData {
	t.Helper()

	fnPtr := reflect.ValueOf(converter).Pointer()
	fnDesc := runtime.FuncForPC(fnPtr)
	filename, line := fnDesc.FileLine(fnPtr)
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filename, nil, parser.ParseComments)
	assert.NoError(t, err)

	find := &FindBlockByFuncName{
		Fset:     fset,
		Line:     line,
		FuncName: getFuncName(t, converter),
	}
	ast.Walk(find, node)

	assert.NotNil(t, find.Block)

	return &ConverterData{
		Func:    reflect.ValueOf(converter),
		SrcType: reflect.TypeOf(converter).In(0).Elem(),
		Fields:  parseOutputTypeFields(find.Block),
	}
}

func getFieldValue(t *testing.T, rv reflect.Value) any {
	t.Helper()

	if ignoreType(t, rv.Type()) {
		return nil
	}

	if rv.Type().Kind() == reflect.Pointer {
		return getFieldValue(t, rv.Elem())
	}

	// to make sure enums are valid
	if isInteger(t, rv.Type()) {
		rv.SetInt(1)
		return 1
	}

	return rv.Interface()
}

func isInteger(t *testing.T, typ reflect.Type) bool {
	t.Helper()

	switch typ.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return true
	default:
		return false
	}
}

// Tells whether to ignore a field or not based on its type.
// Any field that is not primitive is going to be ignored.
func ignoreType(t *testing.T, typ reflect.Type) bool {
	t.Helper()

	switch typ.Kind() {
	case reflect.Struct:
		return true
	case reflect.Pointer:
		return ignoreType(t, typ.Elem())
	case reflect.Array, reflect.Slice:
		return ignoreType(t, typ.Elem())
	default:
		return false
	}
}

func generateObjectWithFakeData(t *testing.T, typ reflect.Type) reflect.Value {
	t.Helper()

	in := reflect.New(typ)

	err := gofakeit.Struct(in.Interface())
	assert.NoError(t, err)

	return in
}

func fieldByName(t *testing.T, obj reflect.Value, name string) (reflect.Value, bool) {
	t.Helper()

	field := obj.FieldByNameFunc(func(s string) bool {
		return strings.EqualFold(s, name)
	})

	zeroValue := reflect.Value{}

	return field, field != zeroValue
}

//nolint:gocognit // The conditions are not that hard to understand
func TestConverters_should_instantiate_valid_obj_from_src(t *testing.T) {
	t.Parallel()

	for _, converter := range testData {
		t.Run(fmt.Sprintf("testing converter %s", getFuncName(t, converter)), func(t *testing.T) {
			t.Parallel()

			converterData := parseConverter(t, converter)
			src := generateObjectWithFakeData(t, converterData.SrcType)

			// calling the converter with generated fake data
			ret := converterData.Func.Call([]reflect.Value{src})

			// assert that the values of the dst fields are populated from the src obj
			for _, field := range converterData.Fields {
				srcValue, ok := fieldByName(t, src.Elem(), field)
				if !ok {
					continue
				}

				dstValue, ok := fieldByName(t, ret[0].Elem(), field)
				if !ok {
					continue
				}

				if ignoreType(t, srcValue.Type()) || ignoreType(t, dstValue.Type()) {
					continue
				}

				assert.Equal(t, getFieldValue(t, srcValue), getFieldValue(t, dstValue))
			}
		})
	}
}

func TestConverters_should_return_nil(t *testing.T) {
	t.Parallel()

	testCases := []any{
		converters.FromDuoIdpSettings,
		converters.FromOktaIdpSettings,
		converters.FromOryIdpSettings,
	}
	testCases = append(testCases, testData...)

	for _, converter := range testCases {
		t.Run(fmt.Sprintf("testing converter %s", getFuncName(t, converter)), func(t *testing.T) {
			t.Parallel()

			converterData := parseConverter(t, converter)

			// calling the converter with nil input
			ret := converterData.Func.Call([]reflect.Value{
				reflect.Zero(reflect.PointerTo(converterData.SrcType)),
			})

			assert.True(t, ret[0].IsNil())
		})
	}
}
