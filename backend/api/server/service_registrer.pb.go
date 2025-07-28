package app_grpc_register

import (
	v1alpha1 "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
)

import (
	"context"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
)

type GrpcServiceRegister struct {
	AppServiceServer v1alpha1.AppServiceServer

	AuthServiceServer v1alpha1.AuthServiceServer

	BadgeServiceServer v1alpha1.BadgeServiceServer

	DeviceServiceServer v1alpha1.DeviceServiceServer

	PolicyServiceServer v1alpha1.PolicyServiceServer

	SettingsServiceServer v1alpha1.SettingsServiceServer
}

func (r GrpcServiceRegister) RegisterGrpcHandlers(grpcServer *grpc.Server) {

	if r.AppServiceServer != nil {
		v1alpha1.RegisterAppServiceServer(grpcServer, r.AppServiceServer)
	}

	if r.AuthServiceServer != nil {
		v1alpha1.RegisterAuthServiceServer(grpcServer, r.AuthServiceServer)
	}

	if r.BadgeServiceServer != nil {
		v1alpha1.RegisterBadgeServiceServer(grpcServer, r.BadgeServiceServer)
	}

	if r.DeviceServiceServer != nil {
		v1alpha1.RegisterDeviceServiceServer(grpcServer, r.DeviceServiceServer)
	}

	if r.PolicyServiceServer != nil {
		v1alpha1.RegisterPolicyServiceServer(grpcServer, r.PolicyServiceServer)
	}

	if r.SettingsServiceServer != nil {
		v1alpha1.RegisterSettingsServiceServer(grpcServer, r.SettingsServiceServer)
	}

}

func (r GrpcServiceRegister) RegisterHttpHandlers(ctx context.Context, mux *runtime.ServeMux, conn *grpc.ClientConn) error {

	if r.AppServiceServer != nil {
		err := v1alpha1.RegisterAppServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	if r.AuthServiceServer != nil {
		err := v1alpha1.RegisterAuthServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	if r.BadgeServiceServer != nil {
		err := v1alpha1.RegisterBadgeServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	if r.DeviceServiceServer != nil {
		err := v1alpha1.RegisterDeviceServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	if r.PolicyServiceServer != nil {
		err := v1alpha1.RegisterPolicyServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	if r.SettingsServiceServer != nil {
		err := v1alpha1.RegisterSettingsServiceHandler(ctx, mux, conn)
		if err != nil {
			return err
		}
	}

	return nil
}
