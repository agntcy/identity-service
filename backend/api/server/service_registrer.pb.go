package app_grpc_register

import (
	v1alpha1 "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
)

import (
	"context"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

type GrpcServiceRegister struct {
	AppServiceServer v1alpha1.AppServiceServer
}

func (r GrpcServiceRegister) RegisterGrpcHandlers(grpcServer *grpc.Server) {

	if r.AppServiceServer != nil {
		v1alpha1.RegisterAppServiceServer(grpcServer, r.AppServiceServer)
	}

}

func (r GrpcServiceRegister) RegisterHttpHandlers(ctx context.Context, mux *runtime.ServeMux, conn *grpc.ClientConn) error {

	if r.AppServiceServer != nil {
		err := v1alpha1.RegisterAppServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	return nil
}
