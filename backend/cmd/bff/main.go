// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"math"
	"net/http"
	"os"
	"os/signal"
	"time"

	identity_platform_api "github.com/agntcy/identity-platform/api/server"
	"github.com/agntcy/identity-platform/internal/bff"
	bffgrpc "github.com/agntcy/identity-platform/internal/bff/grpc"
	apppg "github.com/agntcy/identity-platform/internal/core/app/postgres"
	settingspg "github.com/agntcy/identity-platform/internal/core/settings/postgres"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	outshiftiam "github.com/agntcy/identity-platform/internal/pkg/iam"
	"github.com/agntcy/identity-platform/internal/pkg/interceptors"
	"github.com/agntcy/identity-platform/pkg/cmd"
	"github.com/agntcy/identity-platform/pkg/db"
	"github.com/agntcy/identity-platform/pkg/grpcserver"
	"github.com/agntcy/identity-platform/pkg/log"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/keepalive"
)

// ------------------------ GLOBAL -------------------- //

var maxMsgSize = math.MaxInt64

// ------------------------ GLOBAL -------------------- //

//nolint:funlen // Ignore linting for main function
func main() {
	ctx, cancel := context.WithCancel(context.Background())

	config, err := cmd.GetConfiguration[Configuration]()
	if err != nil {
		log.WithFields(logrus.Fields{log.ErrorField: err}).Fatal("failed to start")
	}

	// Configure log level
	log.Init(config.GoEnv)
	log.SetLogLevel(config.LogLevel)

	log.Info("Starting in env:", config.GoEnv)

	// Create a gRPC server object
	//nolint:lll // Ignore linting for long lines
	var kaep = keepalive.EnforcementPolicy{
		MinTime: time.Duration(
			config.ServerGrpcKeepAliveEnvorcementPolicyMinTime,
		) * time.Second, // If a client pings more than once every X seconds, terminate the connection
		PermitWithoutStream: config.ServerGrpcKeepAliveEnvorcementPolicyPermitWithoutStream, // Allow pings even when there are no active streams
	}

	var kasp = keepalive.ServerParameters{
		MaxConnectionIdle: time.Duration(
			config.ServerGrpcKeepAliveServerParametersMaxConnectionIdle,
		) * time.Second, // If a client is idle for X seconds, send a GOAWAY
		Time: time.Duration(
			config.ServerGrpcKeepAliveServerParametersTime,
		) * time.Second, // Ping the client if it is idle for X seconds to ensure the connection is still active
		Timeout: time.Duration(
			config.ServerGrpcKeepAliveServerParametersTimeout,
		) * time.Second, // Wait X second for the ping ack before assuming the connection is dead
	}

	// Create a database context
	dbContext := db.NewContext(
		config.DbHost,
		config.DbPort,
		config.DbName,
		config.DbUsername,
		config.DbPassword,
		config.DbUseSsl,
	)

	// Connect to the database
	err = dbContext.Connect()
	if err != nil {
		log.Fatal(err)
	}

	// Migrate the database
	err = dbContext.AutoMigrate(
		&apppg.App{},                 // App model
		&settingspg.IssuerSettings{}, // Issuer settings model
	)
	if err != nil {
		log.Fatal(err)
	}

	// Disconnect the database client when done
	defer func() {
		if err = dbContext.Disconnect(); err != nil {
			log.Fatal(err)
		}
	}()

	// IAM
	iamClient := outshiftiam.NewClient(
		http.DefaultClient,
		config.IamApiUrl,
		config.IamAdminAPIKey,
		config.IamMultiTenant,
		config.IamSingleTenantID,
		&config.IamIssuer,
		&config.IamUserCid,
		&config.IamApiKeyCid,
	)

	// Tenant interceptor
	authInterceptor := interceptors.NewAuthInterceptor(
		iamClient,
		config.IamProductID,
	)

	// Create a GRPC server
	grpcsrv, err := grpcserver.New(
		config.ServerGrpcHost,
		grpc.ChainUnaryInterceptor(
			authInterceptor.Unary, // Add the auth interceptor
		),
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.MaxRecvMsgSize(maxMsgSize),
		grpc.MaxSendMsgSize(maxMsgSize),
		grpc.KeepaliveEnforcementPolicy(kaep),
		grpc.KeepaliveParams(kasp),
	)
	if err != nil {
		log.Error(err)
	}

	defer func() {
		_ = grpcsrv.Shutdown(ctx)
	}()

	// Create repositories
	appRepository := apppg.NewRepository(dbContext)
	settingsRepository := settingspg.NewRepository(dbContext)

	// Create internal services
	appSrv := bff.NewAppService(
		appRepository,
	)
	settingsSrv := bff.NewSettingsService(
		iamClient,
		settingsRepository,
	)

	register := identity_platform_api.GrpcServiceRegister{
		AppServiceServer:      bffgrpc.NewAppService(appSrv),
		SettingsServiceServer: bffgrpc.NewSettingsService(settingsSrv),
	}

	register.RegisterGrpcHandlers(grpcsrv.Server)

	// Serve gRPC server
	log.Info("Serving gRPC on:", config.ServerGrpcHost)

	go func() {
		if err := grpcsrv.Run(); err != nil {
			log.Fatal(err)
		}
	}()

	// Create a client connection to the gRPC server we just started
	// This is where the gRPC-Gateway proxies the requests

	//nolint:lll // Allow long line for struct
	var kacp = keepalive.ClientParameters{
		Time: time.Duration(
			config.ClientGrpcKeepAliveClientParametersTime,
		) * time.Second, // Ping the client if it is idle for X seconds to ensure the connection is still active
		Timeout: time.Duration(
			config.ClientGrpcKeepAliveClientParametersTimeout,
		) * time.Second, // Wait X second for the ping ack before assuming the connection is dead
		PermitWithoutStream: config.ClientGrpcKeepAliveClientParametersPermitWithoutStream, // Allow pings even when there are no active streams
	}

	conn, err := grpc.NewClient(
		"0.0.0.0"+config.ServerGrpcHost,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
		grpc.WithKeepaliveParams(kacp),
		grpc.WithDefaultCallOptions(
			grpc.MaxCallRecvMsgSize(maxMsgSize),
			grpc.MaxCallSendMsgSize(maxMsgSize),
		),
	)
	if err != nil {
		log.Error("Failed to dial server:", err)
	}

	gwOpts := []runtime.ServeMuxOption{
		runtime.WithHealthzEndpoint(grpc_health_v1.NewHealthClient(conn)),
		runtime.WithIncomingHeaderMatcher(grpcutil.CustomMatcher),
	}
	gwmux := runtime.NewServeMux(gwOpts...)

	err = register.RegisterHttpHandlers(ctx, gwmux, conn)
	if err != nil {
		log.Error(err)
	}

	// Setup cors for dev
	options := cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"PUT", "GET", "DELETE", "POST", "PATCH"},
		AllowedHeaders: []string{
			"X-Requested-With",
			"content-type",
			"Origin",
			"Accept",
			"Authorization",
			"X-Id-Api-Key",
		},
		AllowCredentials: true,

		// Enable Debugging for testing, consider disabling in production
		Debug: true,
	}

	// Check current env
	if config.GoEnv != "development" {
		options.Debug = false
	}
	c := cors.New(options)

	gwServer := &http.Server{
		Addr:              config.ServerHttpHost,
		Handler:           c.Handler(gwmux),
		WriteTimeout:      time.Duration(config.HttpServerWriteTimeout) * time.Second,
		IdleTimeout:       time.Duration(config.HttpServerIdleTimeout) * time.Second,
		ReadTimeout:       time.Duration(config.HttpServerReadTimeout) * time.Second,
		ReadHeaderTimeout: time.Duration(config.HttpServerReadHeaderTimeout) * time.Second,
	}

	defer func() {
		_ = gwServer.Shutdown(ctx)
	}()

	go func() {
		log.Info("Serving gRPC-Gateway on:", config.ServerHttpHost)

		if err := gwServer.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	}()

	interrupChannel := make(chan os.Signal, 1)
	signal.Notify(interrupChannel, os.Interrupt)
	<-interrupChannel

	log.Info("Exiting the node")

	cancel()
}
