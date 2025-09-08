/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* c8 ignore start */

import {SecureRouteProps} from '@/types/okta';
import * as React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import {AuthError} from './auth-error';
import {useAuth} from '@/hooks';

let useRouteNavigate: any;
if ('useNavigate' in ReactRouterDom) {
  // trick static analyzer to avoid "'useNavigate' is not exported" error
  useRouteNavigate = (ReactRouterDom as any)['useNavigate' in ReactRouterDom ? 'useNavigate' : ''];
} else {
  // throw when useNavigate is triggered
  useRouteNavigate = () => {
    throw new Error(
      'Unsupported: SecureRoute only works with react-router-dom v6 or any router library with compatible APIs.'
    );
  };
}

export const SecureRoute: React.FC<React.PropsWithChildren<SecureRouteProps>> = ({
  redirectPath = '/login',
  isAllowed = true,
  shouldRedirect = true,
  children,
  onAuthRequired,
  errorComponent
}) => {
  const {oktaInstance, authInfo, login} = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const navigate = useRouteNavigate();
  const pendingLogin = React.useRef(false);
  const [handleLoginError, setHandleLoginError] = React.useState<Error | null>(null);
  const ErrorReporter = errorComponent || AuthError;

  React.useEffect(() => {
    const handleLogin = async () => {
      if (pendingLogin.current) {
        return;
      }

      pendingLogin.current = true;

      const onAuthRequiredFn = onAuthRequired;

      if (onAuthRequiredFn) {
        await onAuthRequiredFn(oktaInstance);
      } else {
        if (login) {
          void login();
        } else {
          return;
        }
      }
    };

    if (!navigate) {
      return;
    }

    if (!authInfo) {
      return;
    }

    if (authInfo?.isAuthenticated) {
      pendingLogin.current = false;
      return;
    }

    // Start login if app has decided it is not logged in and there is no pending signin
    if (!authInfo?.isAuthenticated) {
      handleLogin().catch((err) => {
        setHandleLoginError(err as Error);
      });
    }
  }, [oktaInstance, navigate, authInfo, onAuthRequired, login]);

  if (handleLoginError) {
    return <ErrorReporter error={handleLoginError} />;
  }

  if (!authInfo || !authInfo?.isAuthenticated || !isAllowed) {
    return shouldRedirect ? <ReactRouterDom.Navigate to={redirectPath} replace /> : null;
  }

  return children ? <>{children}</> : <ReactRouterDom.Outlet />;
};

/* c8 ignore stop */
