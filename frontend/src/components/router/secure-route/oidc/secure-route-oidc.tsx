/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {withAuthenticationRequired} from 'react-oidc-context';
import * as ReactRouterDom from 'react-router-dom';
import {SecureRoutePropsOIDC} from '@/types/auth/oidc';
import {AuthError} from '../../auth-error';

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

const SecureRouteComponent: React.FC<React.PropsWithChildren<SecureRoutePropsOIDC>> = ({
  children,
  isAllowed = true,
  shouldRedirect = true,
  redirectPath = '/login'
}) => {
  if (!isAllowed) {
    return shouldRedirect ? <ReactRouterDom.Navigate to={redirectPath} replace /> : null;
  }

  return children ? <>{children}</> : <ReactRouterDom.Outlet />;
};

export const SecureRouteOIDC = ({
  errorComponent,
  redirectPath = '/login',
  ...props
}: React.PropsWithChildren<SecureRoutePropsOIDC>) => {
  const RedirectComponent = () => <ReactRouterDom.Navigate to={redirectPath} replace />;

  const WrappedComponent = withAuthenticationRequired(
    (componentProps: React.PropsWithChildren<SecureRoutePropsOIDC>) => <SecureRouteComponent {...componentProps} />,
    {
      OnRedirecting: RedirectComponent,
      onBeforeSignin: () => {
        // Prevent automatic signin by throwing an error or doing nothing
        throw new Error('Automatic signin blocked - redirect to login page instead');
      }
    }
  );

  // Wrap the component to handle errors if needed
  const ComponentWithErrorHandling: React.FC<React.PropsWithChildren<SecureRoutePropsOIDC>> = (componentProps) => {
    try {
      return <WrappedComponent {...componentProps} />;
    } catch (error) {
      if (errorComponent) {
        const ErrorReporter = errorComponent;
        return <ErrorReporter error={error as Error} />;
      }
      return <AuthError error={error as Error} />;
    }
  };

  return <ComponentWithErrorHandling {...props} />;
};
