// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/agntcy/identity/pkg/oidc"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	identity_service_api "github.com/outshift/identity-service/api/server"
	"github.com/outshift/identity-service/internal/bff"
	bffgrpc "github.com/outshift/identity-service/internal/bff/grpc"
	apppg "github.com/outshift/identity-service/internal/core/app/postgres"
	authpg "github.com/outshift/identity-service/internal/core/auth/postgres"
	badgecore "github.com/outshift/identity-service/internal/core/badge"
	badgea2a "github.com/outshift/identity-service/internal/core/badge/a2a"
	badgemcp "github.com/outshift/identity-service/internal/core/badge/mcp"
	badgepg "github.com/outshift/identity-service/internal/core/badge/postgres"
	devicepg "github.com/outshift/identity-service/internal/core/device/postgres"
	iampg "github.com/outshift/identity-service/internal/core/iam/postgres"
	identitycore "github.com/outshift/identity-service/internal/core/identity"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
	"github.com/outshift/identity-service/internal/core/issuer"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	policypg "github.com/outshift/identity-service/internal/core/policy/postgres"
	settingspg "github.com/outshift/identity-service/internal/core/settings/postgres"
	"github.com/outshift/identity-service/internal/pkg/grpcutil"
	"github.com/outshift/identity-service/internal/pkg/iam"
	"github.com/outshift/identity-service/internal/pkg/interceptors"
	"github.com/outshift/identity-service/internal/pkg/secrets"
	"github.com/outshift/identity-service/internal/pkg/vault"
	"github.com/outshift/identity-service/internal/pkg/webpush"
	"github.com/outshift/identity-service/pkg/cmd"
	"github.com/outshift/identity-service/pkg/db"
	"github.com/outshift/identity-service/pkg/grpcserver"
	"github.com/outshift/identity-service/pkg/log"
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

	// Initialize the database connection
	dbContext, err := initializeDbContext(config)
	if err != nil {
		log.Fatal(err)
	}

	// Migrate the database models.
	// The plural name of the structs will be
	// used by Gorm to create tables
	err = dbContext.AutoMigrate(
		&apppg.App{},
		&devicepg.Device{},
		&settingspg.IssuerSettings{},
		&settingspg.DuoIdpSettings{},
		&settingspg.OktaIdpSettings{},
		&settingspg.OryIdpSettings{},
		&badgepg.Badge{},
		&badgepg.CredentialSchema{},
		&badgepg.CredentialStatus{},
		&authpg.Session{},
		&authpg.SessionDeviceOTP{},
		&policypg.Policy{},
		&policypg.Task{},
		&policypg.Rule{},
		&iampg.APIKey{},
	)
	if err != nil {
		log.Fatal(
			err,
		)
	}

	crypter := secrets.NewSymmetricCrypter([]byte(config.SecretsCryptoKey))

	// IAM
	iamClient := initializeIAMClient(config, dbContext, crypter)

	// Tenant interceptor
	authInterceptor := interceptors.NewAuthInterceptor(
		iamClient,
	)

	// Initialize the gRPC Server
	grpcsrv, err := initializeGrpcServer(config, authInterceptor.Unary)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize the application services
	register := initializeServices(ctx, config, dbContext, crypter, iamClient)
	register.RegisterGrpcHandlers(grpcsrv.Server)

	// Serve gRPC server
	log.Info("Serving gRPC on:", config.ServerGrpcHost)

	go func() {
		if err := grpcsrv.Run(ctx); err != nil {
			log.Fatal(err)
		}
	}()

	// Initialize the HTTP server
	gwServer, err := initializeHttpServer(ctx, config, register)
	if err != nil {
		log.Fatal(err)
	}

	// Disconnect the database client when done
	defer func() {
		if err = dbContext.Disconnect(); err != nil {
			log.Fatal(err)
		}
	}()

	defer func() {
		_ = grpcsrv.Shutdown(ctx)
	}()

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

func initializeDbContext(config *Configuration) (db.Context, error) {
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
	err := dbContext.Connect()
	if err != nil {
		return nil, err
	}

	return dbContext, nil
}

func initializeIAMClient(
	config *Configuration,
	dbContext db.Context,
	crypter secrets.Crypter,
) iam.Client {
	var iamClient iam.Client

	iamRepository := iampg.NewRepository(dbContext.Client(), crypter)

	if config.IamMultiTenant {
		iamClient = iam.NewMultitenantClient()
	} else {
		jwtVerifier := iam.NewOktaJwtVerifier(
			config.IamIssuer,
			config.IamUserCid,
		)
		iamClient = iam.NewStandaloneClient(
			config.IamOrganization,
			iamRepository,
			jwtVerifier,
		)
	}

	return iamClient
}

func initializeGrpcServer(
	config *Configuration,
	unaryInterceptors ...grpc.UnaryServerInterceptor,
) (*grpcserver.Server, error) {
	// Create a gRPC server object
	//nolint:lll // Ignore linting for long lines
	var kaep = keepalive.EnforcementPolicy{
		MinTime: time.Duration(
			config.ServerGrpcKeepAliveEnvorcementPolicyMinTime,
		) * time.Second, // If a client pings more than once every X seconds, terminate the connection
		PermitWithoutStream: config.ServerGrpcKeepAliveEnforcementPolicyPermitWithoutStream, // Allow pings even when there are no active streams
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

	// Create a GRPC server
	return grpcserver.New(
		config.ServerGrpcHost,
		grpc.ChainUnaryInterceptor(unaryInterceptors...),
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.MaxRecvMsgSize(maxMsgSize),
		grpc.MaxSendMsgSize(maxMsgSize),
		grpc.KeepaliveEnforcementPolicy(kaep),
		grpc.KeepaliveParams(kasp),
	)
}

func initializeServices(
	ctx context.Context,
	config *Configuration,
	dbContext db.Context,
	crypter secrets.Crypter,
	iamClient iam.Client,
) *identity_service_api.GrpcServiceRegister {
	// Create repositories
	appRepository := apppg.NewRepository(dbContext.Client())
	settingsRepository := settingspg.NewRepository(dbContext.Client(), crypter)
	badgeRepository := badgepg.NewRepository(dbContext.Client())
	deviceRepository := devicepg.NewRepository(dbContext.Client())
	authRepository := authpg.NewRepository(dbContext.Client(), crypter)
	policyRepository := policypg.NewRepository(dbContext.Client())

	// Get the token depending on the environment
	token := ""
	if !config.IsProd() {
		// In dev mode, we use the root token
		token = os.Getenv("VAULT_DEV_ROOT_TOKEN")
	}

	var (
		credentialStore idpcore.CredentialStore
		keyStore        identitycore.KeyStore
	)

	switch config.KeyStoreType {
	case KeyStoreTypeVault:
		vaultClient, err := vault.NewHashicorpVaultService(
			config.VaultHost,
			config.VaultPort,
			config.VaultUseSsl,
			token, // This should be set in dev mode only
		)
		if err != nil {
			log.Error("unable to create vault client ", err)
		}

		credentialStore = idpcore.NewVaultCredentialStore(vaultClient)

		keyStore, err = identitycore.NewVaultKeyStore(
			config.VaultHost,
			config.VaultPort,
			config.VaultUseSsl,
			token, // This should be set in dev mode only
		)
		if err != nil {
			log.Fatal("unable to create vault key store ", err)
		}
	case KeyStoreTypeAwsSm:
		awscfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(config.AwsRegion))
		if err != nil {
			log.Fatal("unable to load aws config ", err)
		}

		credentialStore, err = idpcore.NewAwsSmCredentialStore(
			&awscfg,
			nil,
			config.AwsSecretsPrefix,
		)
		if err != nil {
			log.Fatal("unable to create AWS SM client ", err)
		}

		keyStore, err = identitycore.NewAwsSmKeyStore(&awscfg, nil, config.AwsSecretsPrefix)
		if err != nil {
			log.Fatal("unable to create AWS SM key store ", err)
		}
	default:
		log.Fatal("invalid KeyStoreType value ", config.KeyStoreType)
	}

	idpFactory := idpcore.NewFactory()

	// OIDC Authenticator
	oidcAuthenticator := oidc.NewAuthenticator()
	a2aClient := badgea2a.NewDiscoveryClient()
	mcpClient := badgemcp.NewDiscoveryClient()

	// Identity service
	identityService := identitycore.NewService(
		config.IdentityHost,
		config.IdentityPort,
		keyStore,
		oidcAuthenticator,
		config.UniqueIssuerPerTenant,
	)
	taskService := policycore.NewTaskService(mcpClient, policyRepository)

	badgeRevoker := badgecore.NewRevoker(badgeRepository, identityService)

	policyEvaluator := policycore.NewEvaluator(policyRepository)

	// Create internal services
	appSrv := bff.NewAppService(
		appRepository,
		settingsRepository,
		identityService,
		idpFactory,
		credentialStore,
		iamClient,
		badgeRevoker,
		keyStore,
		policyRepository,
		taskService,
	)
	issuerSrv := issuer.NewService(
		identityService,
		idpFactory,
		credentialStore,
	)
	settingsSrv := bff.NewSettingsService(
		issuerSrv,
		iamClient,
		settingsRepository,
	)
	badgeSrv := bff.NewBadgeService(
		settingsRepository,
		appRepository,
		badgeRepository,
		a2aClient,
		mcpClient,
		keyStore,
		identityService,
		credentialStore,
		taskService,
		badgeRevoker,
	)
	notificationSrv := bff.NewNotificationService(
		webpush.NewWebPushSender(),
		config.WebApprovalEmail,
		config.WebApprovalPubKey,
		config.WebApprovalPrivKey,
	)
	authSrv := bff.NewAuthService(
		authRepository,
		credentialStore,
		oidcAuthenticator,
		appRepository,
		policyEvaluator,
		deviceRepository,
		notificationSrv,
		settingsRepository,
		keyStore,
	)
	policySrv := bff.NewPolicyService(appRepository, policyRepository)
	deviceSrv := bff.NewDeviceService(
		deviceRepository,
		notificationSrv,
	)

	register := identity_service_api.GrpcServiceRegister{
		AppServiceServer:      bffgrpc.NewAppService(appSrv, badgeSrv),
		SettingsServiceServer: bffgrpc.NewSettingsService(settingsSrv),
		BadgeServiceServer:    bffgrpc.NewBadgeService(badgeSrv),
		AuthServiceServer:     bffgrpc.NewAuthService(authSrv, appSrv),
		PolicyServiceServer:   bffgrpc.NewPolicyService(policySrv),
		DeviceServiceServer:   bffgrpc.NewDeviceService(deviceSrv),
	}

	return &register
}

func initializeHttpServer(
	ctx context.Context,
	config *Configuration,
	register *identity_service_api.GrpcServiceRegister,
) (*http.Server, error) {
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
		return nil, fmt.Errorf("failed to dial server: %w", err)
	}

	gwOpts := []runtime.ServeMuxOption{
		runtime.WithHealthzEndpoint(grpc_health_v1.NewHealthClient(conn)),
		runtime.WithIncomingHeaderMatcher(grpcutil.CustomMatcher),
	}
	gwmux := runtime.NewServeMux(gwOpts...)

	err = register.RegisterHttpHandlers(ctx, gwmux, conn)
	if err != nil {
		return nil, fmt.Errorf("failed to register HTTP handlers: %w", err)
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
		Debug: config.IsDev(),
	}

	// Check current env
	if !config.IsDev() {
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

	return gwServer, nil
}
