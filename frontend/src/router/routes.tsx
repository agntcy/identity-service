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
import {SettingsProvider} from '@/providers/settings-provider/settings-provider';
import {useFeatureFlagsStore, useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

const Welcome = React.lazy(() => import('@/pages/welcome/welcome'));
const SettingsIdentityProvider = React.lazy(() => import('@/pages/settings/identity-provider/settings-identity-provider'));
const SettingsCreateIdentityProvider = React.lazy(() => import('@/pages/settings/identity-provider/settings-create-identity-provider'));
const Dashboard = React.lazy(() => import('@/pages/dashboard/dashboard'));
const SettingsApiKey = React.lazy(() => import('@/pages/settings/api-key/settings-api-key'));
const SettingsOrganizations = React.lazy(() => import('@/pages/settings/organizations/settings-organizations'));
const UpdateOrganization = React.lazy(() => import('@/pages/settings/organizations/update-organization'));
const OrganizationInfo = React.lazy(() => import('@/pages/settings/organizations/info-organization'));
const AgenticServices = React.lazy(() => import('@/pages/agentic-services/agentic-services'));
const CreateAgenticService = React.lazy(() => import('@/pages/agentic-services/agentic-service-create'));
const UpdateAgenticService = React.lazy(() => import('@/pages/agentic-services/agentic-service-update'));
const AgenticServiceInfo = React.lazy(() => import('@/pages/agentic-services/agentic-service-info'));
const Policies = React.lazy(() => import('@/pages/policies/policies'));
const CreatePolicies = React.lazy(() => import('@/pages/policies/policies-create'));
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
            <SettingsProvider>
              <BannerProvider>
                <Layout />
              </BannerProvider>
            </SettingsProvider>
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
  const {isEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp
    }))
  );

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((store) => ({
      isTbacEnable: store.featureFlags.isTbacEnable
    }))
  );

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
            element: <CreateAgenticService />,
            disabled: isEmptyIdp
          },
          {
            path: PATHS.agenticServices.update,
            element: <UpdateAgenticService />,
            disabled: isEmptyIdp
          },
          {
            path: PATHS.agenticServices.info,
            element: <AgenticServiceInfo />,
            disabled: isEmptyIdp
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
        path: PATHS.policies.base,
        disabled: !isTbacEnable,
        children: [
          {
            index: true,
            element: <Policies />
          },
          {
            path: PATHS.policies.create,
            element: <CreatePolicies />
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
            element: <Navigate to={PATHS.settings.identityProvider.base} replace />
          },
          {
            path: PATHS.settings.identityProvider.base,
            children: [
              {
                index: true,
                element: <SettingsIdentityProvider />
              },
              {
                path: PATHS.settings.identityProvider.create,
                element: <SettingsCreateIdentityProvider />,
                disabled: !isEmptyIdp
              },
              {
                path: '*',
                element: <NotFound />
              }
            ]
          },
          {
            path: PATHS.settings.apiKey,
            element: <SettingsApiKey />
          },
          {
            path: PATHS.settings.organizationsAndUsers.base,
            children: [
              {
                index: true,
                element: <SettingsOrganizations />
              },
              {
                path: PATHS.settings.organizationsAndUsers.update,
                element: <UpdateOrganization />
              },
              {
                path: PATHS.settings.organizationsAndUsers.info,
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
      }
    ];
  }, [isEmptyIdp, isTbacEnable]);

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
