// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package grpcserver

import (
	"context"
	"net"

	"github.com/outshift/identity-service/pkg"
	"google.golang.org/grpc"
)

type Server struct {
	host   string
	Server *grpc.Server
}

func New(host string, opts ...grpc.ServerOption) (*Server, error) {
	srv := &Server{
		host: host,
	}

	srv.Server = grpc.NewServer(opts...)

	return srv, nil
}

func (s *Server) Run() error {
	listener, err := net.Listen("tcp", s.host)
	if err != nil {
		return err
	}

	return s.Server.Serve(listener)
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.Server == nil {
		return nil
	}

	return pkg.ShutdownWithContext(ctx, func(ctx context.Context) error {
		s.Server.GracefulStop()
		return nil
	}, func() error {
		s.Server.Stop()
		return nil
	})
}
