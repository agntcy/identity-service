/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Route} from '@/types/router';
import {useCallback, useMemo} from 'react';
import {PATHS} from './paths';
import {NodeRoute} from '@/components/router/node-route';
import NotFound from '@/components/router/404';
import Layout from '@/components/layout/layout';
import {Navigate} from 'react-router-dom';
import React from 'react';
import {SecureRoute} from '@/components/router/secure-route';
import {Loading} from '@/components/ui/loading';
import {BannerProvider} from '@/providers/banner-provider/banner-provider';

const Welcome = React.lazy(() => import('@/pages/welcome/welcome'));
const SettingsIdentityProvider = React.lazy(() => import('@/pages/settings/identity-provider/settings-identity-provider'));
const TermsAndConditions = React.lazy(() => import('@/pages/terms-and-conditions/terms-and-conditions'));
const Dashboard = React.lazy(() => import('@/pages/dashboard/dashboard'));
const SettingsApiKey = React.lazy(() => import('@/pages/settings/api-key/settings-api-key'));
const SettingsOrganizations = React.lazy(() => import('@/pages/settings/organizations/settings-organizations'));
const CreateOrganization = React.lazy(() => import('@/pages/settings/organizations/create-organization'));
const OrganizationInfo = React.lazy(() => import('@/pages/settings/organizations/info-organization'));
const AgenticServices = React.lazy(() => import('@/pages/agentic-services/agentic-services'));
const CreateAgenticService = React.lazy(() => import('@/pages/agentic-services/create-agentic-service'));
const AccessPolicies = React.lazy(() => import('@/pages/access-policies/access-policies'));
const VerifyIdentityPrivate = React.lazy(() => import('@/pages/agentic-services/verify-identity-private'));
const VerifyIdentityPublic = React.lazy(() => import('@/pages/verify-identity/verify-identity-public'));

export const generateRoutes = (routes: Route[]): Route[] => {
  return [
    {
      path: PATHS.welcome,
      element: (
        <NodeRoute>
          <Welcome />
        </NodeRoute>
      )
    },
    {
      path: PATHS.callBackLoading,
      element: (
        <NodeRoute>
          <Loading />
        </NodeRoute>
      )
    },
    {
      path: PATHS.verifyIdentity,
      element: (
        <NodeRoute>
          <VerifyIdentityPublic />
        </NodeRoute>
      )
    },
    {
      path: PATHS.basePath,
      element: (
        <SecureRoute redirectPath={PATHS.welcome}>
          <NodeRoute>
            <BannerProvider>
              <Layout />
            </BannerProvider>
          </NodeRoute>
        </SecureRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={PATHS.dashboard} replace />
        },
        ...routes,
        {
          path: '*',
          element: <NotFound />
        }
      ]
    }
  ];
};

export const useRoutes = () => {
  // TODO: create router according to IAM entitlements and Identity Provider
  const routes = useMemo<Route[]>(() => {
    return [
      {
        path: PATHS.dashboard,
        children: [
          {
            index: true,
            element: <Dashboard />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.agenticServices.base,
        children: [
          {
            index: true,
            element: <AgenticServices />
          },
          {
            path: PATHS.agenticServices.create,
            element: <CreateAgenticService />
          },
          {
            path: PATHS.agenticServices.verifyIdentity,
            element: <VerifyIdentityPrivate />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.accessPolicies.base,
        children: [
          {
            index: true,
            element: <AccessPolicies />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.settings.base,
        children: [
          {
            index: true,
            element: <Navigate to={PATHS.settings.identityProvider} replace />
          },
          {
            path: PATHS.settings.identityProvider,
            element: <SettingsIdentityProvider />
          },
          {
            path: PATHS.settings.apiKey,
            element: <SettingsApiKey />
          },
          {
            path: PATHS.settings.organizations.base,
            children: [
              {
                index: true,
                element: <SettingsOrganizations />
              },
              {
                path: PATHS.settings.organizations.create,
                element: <CreateOrganization />
              },
              {
                path: PATHS.settings.organizations.info,
                element: <OrganizationInfo />
              },
              {
                path: '*',
                element: <NotFound />
              }
            ]
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.termsAndConditions,
        element: <TermsAndConditions />
      }
    ];
  }, []);

  const removeDisabledRoutes = useCallback((routes: Route[]): Route[] => {
    return routes
      .filter((route) => !route.disabled)
      .map((route) => {
        if (route.children) {
          return {
            ...route,
            children: removeDisabledRoutes(route.children)
          };
        }
        return route;
      });
  }, []);

  const routesGenerated = generateRoutes(routes);

  return useMemo(() => {
    return removeDisabledRoutes(routesGenerated);
  }, [removeDisabledRoutes, routesGenerated]);
};
