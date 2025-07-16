// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package bff

import (
	"context"
	"errors"
	"time"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	authcore "github.com/agntcy/identity-platform/internal/core/auth"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	devicecore "github.com/agntcy/identity-platform/internal/core/device"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	policycore "github.com/agntcy/identity-platform/internal/core/policy"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/jwtutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/pkg/log"
	"github.com/agntcy/identity/pkg/oidc"
)

type AuthService interface {
	Authorize(
		ctx context.Context,
		appID, toolName, userToken *string,
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
	authRepository    authcore.Repository
	credentialStore   idpcore.CredentialStore
	oidcAuthenticator oidc.Authenticator
	appRepository     appcore.Repository
	policyEvaluator   policycore.Evaluator
	deviceRepository  devicecore.Repository
	notifService      NotificationService
}

func NewAuthService(
	authRepository authcore.Repository,
	credentialStore idpcore.CredentialStore,
	oidcAuthenticator oidc.Authenticator,
	appRepository appcore.Repository,
	policyEvaluator policycore.Evaluator,
	deviceRepository devicecore.Repository,
	notifService NotificationService,
) AuthService {
	return &authService{
		authRepository:    authRepository,
		credentialStore:   credentialStore,
		oidcAuthenticator: oidcAuthenticator,
		appRepository:     appRepository,
		policyEvaluator:   policyEvaluator,
		deviceRepository:  deviceRepository,
		notifService:      notifService,
	}
}

func (s *authService) Authorize(
	ctx context.Context,
	appID, toolName, _ *string,
) (*authtypes.Session, error) {
	// Get calling identity from context
	ownerAppID, ok := identitycontext.GetAppID(ctx)
	if !ok || ownerAppID == "" {
		return nil, errutil.Err(
			nil,
			"app ID not found in context",
		)
	}

	if appID != nil && *appID == ownerAppID {
		return nil, errutil.Err(
			nil,
			"cannot authorize the same app",
		)
	}

	_, err := s.appRepository.GetApp(ctx, ownerAppID)
	if err != nil {
		return nil, errutil.Err(err, "app not found")
	}

	// When appID is not provided, it means the session is for all apps
	// Policy will be evaluated on the external authorization step
	if appID != nil && *appID != "" {
		app, err := s.appRepository.GetApp(ctx, *appID)
		if err != nil {
			return nil, errutil.Err(err, "app not found")
		}

		// Evaluate the session based on existing policies
		_, err = s.policyEvaluator.Evaluate(ctx, app, ownerAppID, ptrutil.DerefStr(toolName))
		if err != nil {
			return nil, err
		}
	}

	// Create new session
	session, err := s.authRepository.Create(ctx, &authtypes.Session{
		OwnerAppID: ownerAppID,
		AppID:      appID,
		ToolName:   toolName,
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

	// Issue a token
	accessToken, err := s.oidcAuthenticator.Token(
		ctx,
		clientCredentials.Issuer,
		clientCredentials.ClientID,
		clientCredentials.ClientSecret,
	)
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

func (s *authService) ExtAuthZ(
	ctx context.Context,
	accessToken string,
	toolName string,
) error {
	// TODO:
	// - verify correctly the JWT (expiration date)
	// - check the self issued one with the generated keys

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

	log.Debug("Got session by access token: ", session.ID)

	appID, _ := identitycontext.GetAppID(ctx)

	log.Debug("Session appID: ", appID)

	app, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		return errutil.Err(err, "app not found")
	}

	log.Debug("Got app info: ", app.ID)

	// If the session appID is provided (in the authorize call)
	// it needs to match the current context appID
	if session.AppID != nil && appID != "" && *session.AppID != appID {
		return errutil.Err(
			nil,
			"access token is not valid for the specified app",
		)
	}

	// If the session toolName is provided (in the authorize call)
	// we cannot specify another toolName in the ext-authz request
	if session.ToolName != nil && toolName != "" && *session.ToolName != toolName {
		return errutil.Err(
			nil,
			"access token is not valid for the specified tool",
		)
	}

	log.Debug("Verifying access token: ", accessToken)

	// Validate expiration of the access token
	err = jwtutil.Verify(accessToken)
	if err != nil {
		return err
	}

	if toolName == "" {
		toolName = ptrutil.DerefStr(session.ToolName)
	}

	// Evaluate the session based on existing policies
	// Evaluate based on provided appID and toolName and the session appID, toolName
	rule, err := s.policyEvaluator.Evaluate(ctx, app, session.OwnerAppID, toolName)
	if err != nil {
		log.Error("Policy evaluation failed: ", err)

		return err
	}

	if rule.NeedsApproval {
		otp, err := s.sendDeviceOTP(ctx, session)
		if err != nil {
			return err
		}

		err = s.waitForDeviceApproval(ctx, otp.ID)
		if err != nil {
			return err
		}
	}

	// Expire the session
	session.ExpiresAt = ptrutil.Ptr(time.Now().Add(-time.Hour).Unix())

	return err
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

	err = s.notifService.SendOTPNotification(ctx, device, session, otp)
	if err != nil {
		return nil, errutil.Err(err, "unable to send notification")
	}

	return otp, nil
}

func (s *authService) waitForDeviceApproval(ctx context.Context, otpID string) error {
	timeout := 60 * time.Second
	tick := 500 * time.Millisecond

	loopErr := s.activeWaitLoop(
		timeout,
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
