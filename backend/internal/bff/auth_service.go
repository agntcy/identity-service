// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Authentifier: Apache-2.0

package bff

import (
	"context"
	"errors"
	"time"

	"github.com/agntcy/identity/pkg/oidc"
	appcore "github.com/outshift/identity-service/internal/core/app"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	authcore "github.com/outshift/identity-service/internal/core/auth"
	authtypes "github.com/outshift/identity-service/internal/core/auth/types/int"
	devicecore "github.com/outshift/identity-service/internal/core/device"
	"github.com/outshift/identity-service/internal/core/identity"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	settingscore "github.com/outshift/identity-service/internal/core/settings"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/internal/pkg/jwtutil"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/strutil"
	"github.com/outshift/identity-service/pkg/log"
)

const (
	// Default length for authorization codes
	codeLength = 128

	// Default session duration for authorization codes and consumption
	sessionDuration = 5 * time.Minute

	waitForDeviceApprovalTime = 500 // milliseconds
)

type AuthService interface {
	Authorize(
		ctx context.Context,
		resolverMetadataID, toolName, userToken *string,
	) (*authtypes.Session, error)
	Token(
		ctx context.Context,
		authorizationCode string,
	) (*authtypes.Session, error)
	ExtAuthZ(
		ctx context.Context,
		accessToken string,
		toolName string,
	) error
	ApproveToken(
		ctx context.Context,
		deviceID string,
		sessionID string,
		otpValue string,
		approve bool,
	) error
}

type authService struct {
	authRepository     authcore.Repository
	credentialStore    idpcore.CredentialStore
	oidcAuthenticator  oidc.Authenticator
	appRepository      appcore.Repository
	policyEvaluator    policycore.Evaluator
	deviceRepository   devicecore.Repository
	notifService       NotificationService
	settingsRepository settingscore.Repository
	keyStore           identity.KeyStore
}

func NewAuthService(
	authRepository authcore.Repository,
	credentialStore idpcore.CredentialStore,
	oidcAuthenticator oidc.Authenticator,
	appRepository appcore.Repository,
	policyEvaluator policycore.Evaluator,
	deviceRepository devicecore.Repository,
	notifService NotificationService,
	settingsRepository settingscore.Repository,
	keyStore identity.KeyStore,
) AuthService {
	return &authService{
		authRepository:     authRepository,
		credentialStore:    credentialStore,
		oidcAuthenticator:  oidcAuthenticator,
		appRepository:      appRepository,
		policyEvaluator:    policyEvaluator,
		deviceRepository:   deviceRepository,
		notifService:       notifService,
		settingsRepository: settingsRepository,
		keyStore:           keyStore,
	}
}

func (s *authService) Authorize(
	ctx context.Context,
	resolverMetadataID, toolName, _ *string,
) (*authtypes.Session, error) {
	// Get calling identity from context
	ownerAppID, ok := identitycontext.GetAppID(ctx)
	if !ok || ownerAppID == "" {
		return nil, errutil.Err(
			nil,
			"app ID not found in context",
		)
	}

	_, err := s.appRepository.GetApp(ctx, ownerAppID)
	if err != nil {
		return nil, errutil.Err(err, "app not found")
	}

	// If resolverMetadataID is provided, get appID
	var appID *string

	// When resolverMetadataID is not provided, it means the session is for all apps
	// Policy will be evaluated on the external authorization step
	if resolverMetadataID != nil && *resolverMetadataID != "" {
		app, err := s.appRepository.GetAppByResolverMetadataID(ctx, *resolverMetadataID)
		if err != nil {
			return nil, errutil.Err(err, "app not found by resolver metadata ID")
		}

		if app.ID == ownerAppID {
			return nil, errutil.Err(
				nil,
				"cannot authorize the same app",
			)
		}

		appID = &app.ID

		// Evaluate the session based on existing policies
		_, err = s.policyEvaluator.Evaluate(ctx, app, ownerAppID, ptrutil.DerefStr(toolName))
		if err != nil {
			return nil, err
		}
	}

	// Create new session
	session, err := s.authRepository.Create(ctx, &authtypes.Session{
		OwnerAppID:        ownerAppID,
		AppID:             appID,
		ToolName:          toolName,
		AuthorizationCode: ptrutil.Ptr(strutil.Random(codeLength)),
		ExpiresAt:         ptrutil.Ptr(time.Now().Add(sessionDuration).Unix()),
	})
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to create session",
		)
	}

	log.Debug("Created new session: ", session.ID)
	log.Debug("Session auth code: ", session.AuthorizationCode)

	return session, nil
}

func (s *authService) Token(
	ctx context.Context,
	authorizationCode string,
) (*authtypes.Session, error) {
	if authorizationCode == "" {
		return nil, errutil.Err(
			nil,
			"authorization code cannot be empty",
		)
	}

	// Get session by authorization code
	session, err := s.authRepository.GetByAuthorizationCode(ctx, authorizationCode)
	if err != nil {
		return nil, errutil.Err(
			err,
			"invalid session",
		)
	}

	log.Debug("Got session by authorization code: ", session.ID)

	// Check if session already has an access token
	if session.AccessToken != nil {
		return nil, errutil.Err(
			nil,
			"a token has already been issued",
		)
	}

	// Get client credentials from the session
	clientCredentials, err := s.credentialStore.Get(ctx, session.OwnerAppID)
	if err != nil || clientCredentials == nil {
		return nil, errutil.Err(
			err,
			"failed to get client credentials",
		)
	}

	issuer, issErr := s.settingsRepository.GetIssuerSettings(ctx)
	if issErr != nil {
		return nil, errutil.Err(err, "failed to fetch issuer settings")
	}

	accessToken, err := s.issueAccessToken(ctx, issuer, clientCredentials)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to issue token",
		)
	}

	// Look if a session exists
	existingSession, err := s.authRepository.GetByAccessToken(ctx, accessToken)
	if err == nil {
		// Expire current session
		session.ExpiresAt = ptrutil.Ptr(time.Now().Add(-time.Hour).Unix())
		_ = s.authRepository.Update(ctx, session)

		// Return existing session if it exists
		return existingSession, nil
	}

	// Update session with token ID
	session.AccessToken = ptrutil.Ptr(accessToken)

	log.Debug("Updating: ", session.ID)
	log.Debug("Access token: ", *session.AccessToken)

	err = s.authRepository.Update(ctx, session)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to update the session",
		)
	}

	return session, nil
}

func (s *authService) issueAccessToken(
	ctx context.Context,
	issuer *settingstypes.IssuerSettings,
	clientCredentials *idpcore.ClientCredentials,
) (string, error) {
	if issuer.IdpType != settingstypes.IDP_TYPE_SELF && clientCredentials.ClientSecret != "" {
		// Issue a token from an IdP
		return s.oidcAuthenticator.Token(
			ctx,
			clientCredentials.Issuer,
			clientCredentials.ClientID,
			clientCredentials.ClientSecret,
		)
	} else if issuer.IdpType == settingstypes.IDP_TYPE_SELF {
		privKey, keyErr := s.keyStore.RetrievePrivKey(ctx, issuer.KeyID)
		if keyErr != nil {
			return "", errutil.Err(
				keyErr,
				"error retrieving private key from vault for proof generation",
			)
		}

		// Issue a self-signed JWT proof
		return oidc.SelfIssueJWT(
			clientCredentials.Issuer,
			clientCredentials.ClientID,
			privKey,
		)
	}

	return "", errors.New("issuer is not self-issued and the client secret is not set")
}

func (s *authService) ExtAuthZ(
	ctx context.Context,
	accessToken string,
	toolName string,
) error {
	if accessToken == "" {
		return errutil.Err(
			nil,
			"access token cannot be empty",
		)
	}

	session, err := s.authRepository.GetByAccessToken(ctx, accessToken)
	if err != nil {
		return errutil.Err(
			err,
			"invalid session",
		)
	}

	if session.HasExpired() {
		return errutil.Err(nil, "the session has expired")
	}

	log.Debug("Got session by access token: ", session.ID)

	calleeAppID, _ := identitycontext.GetAppID(ctx)

	log.Debug("Session appID: ", calleeAppID)

	calleeApp, err := s.appRepository.GetApp(ctx, calleeAppID)
	if err != nil {
		return errutil.Err(err, "app not found")
	}

	log.Debug("Got app info: ", calleeApp.ID)

	// If the session appID is provided (in the authorize call)
	// it needs to match the current context appID
	if !session.ValidateApp(calleeAppID) {
		return errutil.Err(
			nil,
			"access token is not valid for the specified app",
		)
	}

	// If the session toolName is provided (in the authorize call)
	// we cannot specify another toolName in the ext-authz request
	if !session.ValidateTool(toolName) {
		return errutil.Err(
			nil,
			"access token is not valid for the specified tool",
		)
	}

	// validate the caller app
	callerApp, err := s.appRepository.GetApp(ctx, session.OwnerAppID)
	if err != nil {
		return errutil.Err(err, "the caller app not found")
	}

	log.Debug("Verifying access token: ", accessToken)

	// Validate expiration of the access token
	err = jwtutil.Verify(accessToken)
	if err != nil {
		return err
	}

	// Evaluate the session based on existing policies
	// Evaluate based on provided appID and toolName and the session appID, toolName
	rule, err := s.policyEvaluator.Evaluate(ctx, calleeApp, session.OwnerAppID, toolName)
	if err != nil {
		log.Error("Policy evaluation failed: ", err)

		return err
	}

	if rule.NeedsApproval {
		err := s.sendDeviceOTPAndWaitForApproval(ctx, session, callerApp, calleeApp, &toolName)
		if err != nil {
			return err
		}
	}

	if session.ExpiresAt == nil {
		// We set the token to expire after 1 min.
		// The reason we do this is because DUO and ORY
		// generate the same access token in a 1 sec time window
		// and agents can call other services multiple times
		// during the same prompt which can lead to a failure.
		//
		//nolint:mnd // obviously it's not a magic number
		session.ExpireAfter(60 * time.Second)

		err = s.authRepository.Update(ctx, session)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *authService) sendDeviceOTPAndWaitForApproval(
	ctx context.Context,
	session *authtypes.Session,
	callerApp *apptypes.App,
	calleeApp *apptypes.App,
	toolName *string,
) error {
	otp, err := s.sendDeviceOTP(ctx, session, callerApp, calleeApp, toolName)
	if err != nil {
		return err
	}

	return s.waitForDeviceApproval(ctx, otp.ID)
}

func (s *authService) ApproveToken(
	ctx context.Context,
	deviceID string,
	sessionID string,
	otpValue string,
	approve bool,
) error {
	otp, err := s.authRepository.GetDeviceOTPByValue(ctx, deviceID, sessionID, otpValue)
	if err != nil {
		return err
	}

	if otp == nil {
		return errors.New("cannot find OTP")
	}

	if otp.HasExpired() {
		return errors.New("the OTP is already expired")
	}

	if otp.Used || otp.Approved != nil {
		return errors.New("the OTP is already used")
	}

	otp.Approved = &approve
	otp.UpdatedAt = ptrutil.Ptr(time.Now().Unix())

	err = s.authRepository.UpdateDeviceOTP(ctx, otp)
	if err != nil {
		return err
	}

	return nil
}

func (s *authService) sendDeviceOTP(
	ctx context.Context,
	session *authtypes.Session,
	callerApp *apptypes.App,
	calleeApp *apptypes.App,
	toolName *string,
) (*authtypes.SessionDeviceOTP, error) {
	devices, err := s.deviceRepository.GetDevices(ctx, session.UserID)
	if err != nil {
		return nil, err
	}

	if len(devices) == 0 {
		return nil, errors.New("no devices registered")
	}

	device := devices[len(devices)-1]

	otp := authtypes.NewSessionDeviceOTP(session.ID, device.ID)

	err = s.authRepository.CreateDeviceOTP(ctx, otp)
	if err != nil {
		return nil, err
	}

	err = s.notifService.SendOTPNotification(
		device,
		session,
		otp,
		callerApp,
		calleeApp,
		toolName,
	)
	if err != nil {
		return nil, errutil.Err(err, "unable to send notification")
	}

	return otp, nil
}

func (s *authService) waitForDeviceApproval(ctx context.Context, otpID string) error {
	tick := waitForDeviceApprovalTime * time.Millisecond

	loopErr := s.activeWaitLoop(
		authtypes.SessionDeviceOTPDuration,
		tick,
		func() (bool, error) {
			otp, err := s.authRepository.GetDeviceOTP(ctx, otpID)
			if err != nil {
				return true, err
			}

			if otp.Used {
				return true, errors.New("the OTP is already used")
			}

			if otp.HasExpired() {
				return true, errors.New("the OTP is expired")
			}

			if otp.Approved != nil && !*otp.Approved {
				return true, errors.New("the OTP has been denied by the user")
			}

			if otp.Approved != nil && *otp.Approved {
				return true, nil
			}

			return false, nil
		},
	)

	err := s.flagDeviceOTPAsUsed(ctx, otpID)
	if err != nil {
		return err
	}

	if loopErr == nil {
		return nil
	}

	log.Warn(loopErr)

	return errors.New("the user did not approve the invocation")
}

func (s *authService) flagDeviceOTPAsUsed(ctx context.Context, otpID string) error {
	otp, err := s.authRepository.GetDeviceOTP(ctx, otpID)
	if err != nil {
		return err
	}

	otp.Used = true
	otp.UpdatedAt = ptrutil.Ptr(time.Now().Unix())

	return s.authRepository.UpdateDeviceOTP(ctx, otp)
}

func (s *authService) activeWaitLoop(
	timeoutDuration time.Duration,
	tickDuration time.Duration,
	onTick func() (stop bool, err error),
) error {
	timeout := time.After(timeoutDuration)
	tick := time.Tick(tickDuration)

	for {
		select {
		case <-timeout:
			return errors.New("timeout")
		case <-tick:
			stop, err := onTick()
			if err != nil {
				return err
			}

			if stop {
				return nil
			}
		}
	}
}
