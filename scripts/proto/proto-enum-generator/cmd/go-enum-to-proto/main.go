// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	goflag "flag"
	"log"

	"github.com/spf13/pflag"
)

var scanner = NewEnumScanner()

func init() {
	scanner.BindFlags(pflag.CommandLine)
	_ = goflag.Set("logtostderr", "true")

	pflag.CommandLine.AddGoFlagSet(goflag.CommandLine)
}

func main() {
	pflag.Parse()

	err := scanner.Scan()
	if err != nil {
		log.Fatalf("%v", err)
	}

	_, err = scanner.GenerateProtos(true)
	if err != nil {
		log.Fatalf("%v", err)
	}
}
