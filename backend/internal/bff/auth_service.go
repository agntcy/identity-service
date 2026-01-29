// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package bff

import (
	"context"
	"errors"
	"fmt"
	"time"

	appcore "github.com/agntcy/identity-service/internal/core/app"
	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	authcore "github.com/agntcy/identity-service/internal/core/auth"
	authtypes "github.com/agntcy/identity-service/internal/core/auth/types/int"
	devicecore "github.com/agntcy/identity-service/internal/core/device"
	"github.com/agntcy/identity-service/internal/core/identity"
	idpcore "github.com/agntcy/identity-service/internal/core/idp"
	policycore "github.com/agntcy/identity-service/internal/core/policy"
	settingscore "github.com/agntcy/identity-service/internal/core/settings"
	settingstypes "github.com/agntcy/identity-service/internal/core/settings/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/internal/pkg/jwtutil"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/internal/pkg/strutil"
	"github.com/agntcy/identity-service/pkg/log"
	"github.com/agntcy/identity/pkg/oidc"
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
	callerAppID, ok := identitycontext.GetAppID(ctx)
	if !ok || callerAppID == "" {
		return nil, errutil.Unauthorized("auth.invalidCallerAppId", "Caller application ID should be present in the request.")
	}

	_, err := s.appRepository.GetApp(ctx, callerAppID)
	if err != nil {
		if errors.Is(err, appcore.ErrAppNotFound) {
			return nil, errutil.NotFound("auth.callerAppNotFound", "Caller application not found.")
		}

		return nil, fmt.Errorf("repository failed to fetch the app %s: %w", callerAppID, err)
	}

	// If resolverMetadataID is provided, get calleeAppID
	var calleeAppID *string

	// When resolverMetadataID is not provided, it means the session is for all apps
	// Policy will be evaluated on the external authorization step
	if resolverMetadataID != nil && *resolverMetadataID != "" {
		calleeApp, err := s.getCalleeAppByResolverMetadataID(ctx, *resolverMetadataID)
		if err != nil {
			return nil, err
		}

		if calleeApp.ID == callerAppID {
			return nil, errutil.InvalidRequest(
				"auth.invalidCalleeApp",
				"The caller app and the callee app should not be the same.",
			)
		}

		calleeAppID = &calleeApp.ID

		// Evaluate the session based on existing policies
		_, err = s.policyEvaluator.Evaluate(ctx, calleeApp, callerAppID, ptrutil.DerefStr(toolName))
		if err != nil {
			return nil, err
		}
	}

	// Create new session
	session, err := s.authRepository.CreateSession(ctx, &authtypes.Session{
		OwnerAppID:        callerAppID,
		AppID:             calleeAppID,
		ToolName:          toolName,
		AuthorizationCode: ptrutil.Ptr(strutil.Random(codeLength)),
		ExpiresAt:         ptrutil.Ptr(time.Now().Add(sessionDuration).Unix()),
	})
	if err != nil {
		return nil, fmt.Errorf("repository failed to save session: %w", err)
	}

	log.FromContext(ctx).Debug("Created new session: ", session.ID)
	log.FromContext(ctx).Debug("Session auth code: ", session.AuthorizationCode)

	return session, nil
}

func (s *authService) getCalleeAppByResolverMetadataID(
	ctx context.Context,
	resolverMetadataID string,
) (*apptypes.App, error) {
	calleeApp, err := s.appRepository.GetAppByResolverMetadataID(ctx, resolverMetadataID)
	if err != nil {
		if errors.Is(err, appcore.ErrAppNotFound) {
			return nil, errutil.InvalidRequest(
				"auth.calleeAppNotFound",
				"No application found with the resolver metadata ID %s.",
				resolverMetadataID,
			)
		}

		return nil, fmt.Errorf(
			"repository failed to fetch the app with resolver metadata ID %s: %w",
			resolverMetadataID,
			err,
		)
	}

	return calleeApp, nil
}

func (s *authService) Token(
	ctx context.Context,
	authorizationCode string,
) (*authtypes.Session, error) {
	if authorizationCode == "" {
		return nil, errutil.ValidationFailed("auth.emptyAuthCode", "Authorization code cannot be empty.")
	}

	// Get session by authorization code
	session, err := s.authRepository.GetSessionByAuthCode(ctx, authorizationCode)
	if err != nil {
		if errors.Is(err, authcore.ErrSessionNotFound) {
			return nil, errutil.Unauthorized("auth.sessionNotFound", "Session not found.")
		}

		return nil, fmt.Errorf("repository failed to fetch session: %w", err)
	}

	log.FromContext(ctx).Debug("Got session by authorization code: ", session.ID)

	// Check if session already has an access token
	if session.AccessToken != nil {
		return nil, errutil.InvalidRequest("auth.tokenAlreadyIssued", "A token has already been issued.")
	}

	// Get client credentials from the session
	clientCredentials, err := s.credentialStore.Get(ctx, session.OwnerAppID)
	if err != nil || clientCredentials == nil {
		return nil, fmt.Errorf("credential store client failed to get client credentials: %w", err)
	}

	issuer, issErr := s.settingsRepository.GetIssuerSettings(ctx)
	if issErr != nil {
		return nil, fmt.Errorf("repository failed to fetch issuer settings: %w", err)
	}

	accessToken, err := s.issueAccessToken(ctx, issuer, clientCredentials)
	if err != nil {
		return nil, fmt.Errorf("failed to issue access token: %w", err)
	}

	// Look if a session with the same access token already exists
	existingSession, err := s.authRepository.GetSessionByAccessToken(ctx, accessToken)
	if err == nil {
		// Expire current session
		session.ExpiresAt = ptrutil.Ptr(time.Now().Add(-time.Hour).Unix())

		err := s.authRepository.UpdateSession(ctx, session)
		if err != nil {
			log.FromContext(ctx).
				WithError(err).
				Error("repository in Token failed to update a session with existing access token")
		}

		// Return existing session if it exists
		return existingSession, nil
	} else if !errors.Is(err, authcore.ErrSessionNotFound) {
		log.FromContext(ctx).WithError(err).Error("authRepository.GetByAccessToken failed")
	}

	// Update session with token ID
	session.AccessToken = ptrutil.Ptr(accessToken)

	log.FromContext(ctx).Debug("Updating: ", session.ID)
	log.FromContext(ctx).Debug("Access token: ", *session.AccessToken)

	err = s.authRepository.UpdateSession(ctx, session)
	if err != nil {
		return nil, fmt.Errorf("repository failed to update the session: %w", err)
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
		var (
			accessToken string
			err         error
		)

		accessToken, err = s.oidcAuthenticator.Token(
			ctx,
			clientCredentials.Issuer,
			clientCredentials.ClientID,
			clientCredentials.ClientSecret,
			oidc.WithScopes(clientCredentials.Scopes),
		)
		if err != nil {
			return "", fmt.Errorf("oidc authenticator failed to issue JWT: %w", err)
		}

		return accessToken, err
	} else if issuer.IdpType == settingstypes.IDP_TYPE_SELF {
		privKey, keyErr := s.keyStore.RetrievePrivKey(ctx, issuer.KeyID)
		if keyErr != nil {
			return "", fmt.Errorf(
				"error retrieving private key from vault for access token generation: %w",
				keyErr,
			)
		}

		// Issue a self-signed JWT proof
		accessToken, err := oidc.SelfIssueJWT(
			clientCredentials.Issuer,
			clientCredentials.ClientID,
			privKey,
		)
		if err != nil {
			return "", fmt.Errorf("failed to self issue a JWT: %w", err)
		}

		return accessToken, err
	}

	return "", errors.New("issuer is not self-issued and the client secret is not set")
}

func (s *authService) ExtAuthZ(
	ctx context.Context,
	accessToken string,
	toolName string,
) error {
	if accessToken == "" {
		return errutil.ValidationFailed("auth.emptyAccessToken", "Access token cannot be empty.")
	}

	session, err := s.getSessionByAccessToken(ctx, accessToken)
	if err != nil {
		return err
	}

	if session.HasExpired() {
		return errutil.Unauthorized("auth.sessionExpired", "The session has expired.")
	}

	log.FromContext(ctx).Debug("Got session by access token: ", session.ID)

	calleeAppID, _ := identitycontext.GetAppID(ctx)

	log.FromContext(ctx).Debug("Session appID: ", calleeAppID)

	calleeApp, err := s.getExtAuthZCalleeApp(ctx, calleeAppID)
	if err != nil {
		return err
	}

	log.FromContext(ctx).Debug("Got app info: ", calleeApp.ID)

	// If the session appID is provided (in the authorize call)
	// it needs to match the current context appID
	if !session.ValidateApp(calleeAppID) {
		return errutil.Unauthorized(
			"auth.invalidAccessTokenForApp",
			"The access token is not valid for the specified app.",
		)
	}

	// If the session toolName is provided (in the authorize call)
	// we cannot specify another toolName in the ext-authz request
	if !session.ValidateTool(toolName) {
		return errutil.Unauthorized(
			"auth.invalidAccessTokenForTool",
			"The access token is not valid for the specified tool.",
		)
	}

	// validate the caller app
	callerApp, err := s.getExtAuthZCallerApp(ctx, session.OwnerAppID)
	if err != nil {
		return err
	}

	log.FromContext(ctx).Debug("Verifying access token: ", accessToken)

	// Validate expiration of the access token
	err = jwtutil.Verify(accessToken)
	if err != nil {
		log.FromContext(ctx).WithError(err).Error("failed to verify JWT in ExtAuthZ")
		return errutil.Unauthorized("auth.invalidAccessToken", "The access token is invalid.")
	}

	// Evaluate the session based on existing policies
	// Evaluate based on provided appID and toolName and the session appID, toolName
	rule, err := s.policyEvaluator.Evaluate(ctx, calleeApp, session.OwnerAppID, toolName)
	if err != nil {
		return err
	}

	if rule.NeedsApproval {
		err := s.sendDeviceOTPAndWaitForApproval(ctx, session, callerApp, calleeApp, &toolName)
		if err != nil {
			return err
		}
	}

	err = s.expireSessionIfNecessary(ctx, session)
	if err != nil {
		return err
	}

	return nil
}

func (s *authService) getExtAuthZCalleeApp(ctx context.Context, appID string) (*apptypes.App, error) {
	calleeApp, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		if errors.Is(err, appcore.ErrAppNotFound) {
			return nil, errutil.Unauthorized("auth.calleeAppNotFound", "Callee application not found.")
		}

		return nil, fmt.Errorf("repository in ExtAuthZ failed to fetch callee app %s: %w", appID, err)
	}

	return calleeApp, nil
}

func (s *authService) getExtAuthZCallerApp(ctx context.Context, appID string) (*apptypes.App, error) {
	callerApp, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		if errors.Is(err, appcore.ErrAppNotFound) {
			return nil, errutil.Unauthorized("auth.callerAppNotFound", "Caller application not found.")
		}

		return nil, fmt.Errorf("repository in ExtAuthZ failed to fetch caller app %s: %w", appID, err)
	}

	return callerApp, nil
}

func (s *authService) getSessionByAccessToken(
	ctx context.Context,
	accessToken string,
) (*authtypes.Session, error) {
	session, err := s.authRepository.GetSessionByAccessToken(ctx, accessToken)
	if err != nil {
		if errors.Is(err, authcore.ErrSessionNotFound) {
			return nil, errutil.Unauthorized("auth.sessionNotFound", "Session not found.")
		}

		return nil, fmt.Errorf("repository failed to fetch session with access token: %w", err)
	}

	return session, nil
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

func (s *authService) expireSessionIfNecessary(ctx context.Context, session *authtypes.Session) error {
	if session.ExpiresAt == nil {
		// We set the token to expire after 1 min.
		// The reason we do this is because DUO and ORY
		// generate the same access token in a 1 sec time window
		// and agents can call other services multiple times
		// during the same prompt which can lead to a failure.
		//
		//nolint:mnd // obviously it's not a magic number
		session.ExpireAfter(60 * time.Second)

		err := s.authRepository.UpdateSession(ctx, session)
		if err != nil {
			return fmt.Errorf("repository in ExtAuthZ failed to update session: %w", err)
		}
	}

	return nil
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
		if errors.Is(err, authcore.ErrDeviceOTPNotFound) {
			return errutil.InvalidRequest("auth.deviceOtpNotFound", "Device OTP not found.")
		}

		return fmt.Errorf("repository failed to get device OTP by value for device %s: %w", deviceID, err)
	}

	if otp == nil {
		return errutil.InvalidRequest("auth.deviceOtpNotFound", "Device OTP not found.")
	}

	if otp.HasExpired() {
		return errutil.InvalidRequest("auth.otpExpired", "The device OTP is expired.")
	}

	if otp.Used || otp.Approved != nil {
		return errutil.InvalidRequest("auth.otpAlreadyUsed", "The device OTP is already used.")
	}

	otp.Approved = &approve
	otp.UpdatedAt = ptrutil.Ptr(time.Now().Unix())

	err = s.authRepository.UpdateDeviceOTP(ctx, otp)
	if err != nil {
		return fmt.Errorf("repository in ApproveToken failed to update device OTP %s: %w", otp.ID, err)
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
		return nil, fmt.Errorf("repository in ExtAuthZ failed to devices: %w", err)
	}

	if len(devices) == 0 {
		return nil, errutil.InvalidRequest(
			"auth.noDevicesRegistered",
			"No user devices registered. Unable to send a notification for user approval.",
		)
	}

	// For now we take the lastest registered device and send it the OTP.
	device := devices[len(devices)-1]

	otp := authtypes.NewSessionDeviceOTP(session.ID, device.ID)

	err = s.authRepository.CreateDeviceOTP(ctx, otp)
	if err != nil {
		return nil, fmt.Errorf("repository failed to create device OTP: %w", err)
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
		return nil, fmt.Errorf("unable to send notification to device %s: %w", device.ID, err)
	}

	return otp, nil
}

func (s *authService) waitForDeviceApproval(ctx context.Context, otpID string) error {
	tick := waitForDeviceApprovalTime * time.Millisecond

	loopErr := s.activeWaitLoop(
		authtypes.SessionDeviceOTPDuration,
		tick,
		func() (bool, error) {
			otp, err := s.getDeviceOTP(ctx, otpID)
			if err != nil {
				return true, err
			}

			if otp.Used {
				return true, errutil.Unauthorized("auth.otpAlreadyUsed", "The device OTP is already used.")
			}

			if otp.HasExpired() {
				return true, errutil.Unauthorized("auth.otpExpired", "The device OTP is expired.")
			}

			if otp.IsDenied() {
				return true, errutil.Unauthorized("auth.otpDenied", "The device OTP has been denied by the user.")
			}

			if otp.IsApproved() {
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

	if errutil.IsDomainError(loopErr) {
		log.FromContext(ctx).
			WithError(loopErr).
			Error("the active wait loop in waitForDeviceApproval failed")
	} else {
		log.FromContext(ctx).Info(loopErr)
	}

	return errutil.Unauthorized("auth.invocationNotApproved", "The user did not approve the invocation.")
}

func (s *authService) getDeviceOTP(ctx context.Context, otpID string) (*authtypes.SessionDeviceOTP, error) {
	otp, err := s.authRepository.GetDeviceOTP(ctx, otpID)
	if err != nil {
		if errors.Is(err, authcore.ErrDeviceOTPNotFound) {
			return nil, errutil.InvalidRequest("auth.deviceOtpNotFound", "Device OTP not found.")
		}

		return nil, fmt.Errorf("repository failed to get device OTP %s: %w", otpID, err)
	}

	return otp, nil
}

func (s *authService) flagDeviceOTPAsUsed(ctx context.Context, otpID string) error {
	otp, err := s.authRepository.GetDeviceOTP(ctx, otpID)
	if err != nil {
		return fmt.Errorf("repository in flagDeviceOTPAsUsed failed to get device OTP %s: %w", otpID, err)
	}

	otp.Used = true
	otp.UpdatedAt = ptrutil.Ptr(time.Now().Unix())

	err = s.authRepository.UpdateDeviceOTP(ctx, otp)
	if err != nil {
		return fmt.Errorf("repository in flagDeviceOTPAsUsed failed to update device OTP %s: %w", otpID, err)
	}

	return nil
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
			return errors.New("extAuthZ active wait loop timed out")
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
