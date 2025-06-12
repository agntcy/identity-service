// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package app_grpc_register

import (
	v1alpha1 "github.com/agntcy/identity-saas/api/server/agntcy/identity-saas/issuer/v1alpha1"
	v1alpha11 "github.com/agntcy/identity-saas/api/server/agntcy/identity-saas/node/v1alpha1"
)

import (
	"context"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

type GrpcServiceRegister struct {
	LocalServiceServer v1alpha1.LocalServiceServer

	IdServiceServer v1alpha11.IdServiceServer

	IssuerServiceServer v1alpha11.IssuerServiceServer

	VcServiceServer v1alpha11.VcServiceServer
}

func (r GrpcServiceRegister) RegisterGrpcHandlers(grpcServer *grpc.Server) {

	if r.LocalServiceServer != nil {
		v1alpha1.RegisterLocalServiceServer(grpcServer, r.LocalServiceServer)
	}

	if r.IdServiceServer != nil {
		v1alpha11.RegisterIdServiceServer(grpcServer, r.IdServiceServer)
	}

	if r.IssuerServiceServer != nil {
		v1alpha11.RegisterIssuerServiceServer(grpcServer, r.IssuerServiceServer)
	}

	if r.VcServiceServer != nil {
		v1alpha11.RegisterVcServiceServer(grpcServer, r.VcServiceServer)
	}

}

func (r GrpcServiceRegister) RegisterHttpHandlers(ctx context.Context, mux *runtime.ServeMux, conn *grpc.ClientConn) error {

	if r.IdServiceServer != nil {
		err := v1alpha11.RegisterIdServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	if r.IssuerServiceServer != nil {
		err := v1alpha11.RegisterIssuerServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	if r.VcServiceServer != nil {
		err := v1alpha11.RegisterVcServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	return nil
}
