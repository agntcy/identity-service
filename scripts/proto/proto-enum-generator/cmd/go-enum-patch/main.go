// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	goflag "flag"
	"log"
	"strings"

	"github.com/spf13/pflag"
)

var patchPath string
var patchType string

func init() {
	pflag.StringVar(
		&patchPath,
		"patch",
		patchPath,
		"The path of the JSON patch file generated with go-enum-to-proto tool.",
	)
	pflag.StringVar(
		&patchType,
		"type",
		patchType,
		"The type of the patches to apply. Values: go, proto.",
	)

	_ = goflag.Set("logtostderr", "true")
	pflag.CommandLine.AddGoFlagSet(goflag.CommandLine)
}

func main() {
	pflag.Parse()

	switch strings.ToLower(patchType) {
	case "go":
		p := NewGoPatcher(patchPath)

		err := p.Patch()
		if err != nil {
			log.Fatalf("%v", err)
		}
	case "proto":
		p := NewProtoPatcher(patchPath, "generated.proto")

		err := p.Patch()
		if err != nil {
			log.Fatalf("%v", err)
		}
	default:
		log.Fatalf("Only [go, proto] are supported as patch type.")
	}
}
