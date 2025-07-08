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

// Welcome
const Welcome = React.lazy(() => import('@/pages/welcome/welcome'));

// Settings Identity Provider
const IdentityProvider = React.lazy(() => import('@/pages/settings/identity-provider/identity-provider'));
const ConnectionIdentityProvider = React.lazy(() => import('@/pages/settings/identity-provider/connection-identity-provider'));

// Dashboard
const Dashboard = React.lazy(() => import('@/pages/dashboard/dashboard'));

// Settings API Key
const ApiKey = React.lazy(() => import('@/pages/settings/api-key/api-key'));

// Settings Organizations
const Organizations = React.lazy(() => import('@/pages/settings/organizations/organizations'));
const EditOrganization = React.lazy(() => import('@/pages/settings/organizations/edit-organization'));
const OrganizationInfo = React.lazy(() => import('@/pages/settings/organizations/info-organization'));

// Agentic Services
const AgenticServices = React.lazy(() => import('@/pages/agentic-services/agentic-services'));
const AddAgenticService = React.lazy(() => import('@/pages/agentic-services/add-agentic-service'));
const UpdateAgenticService = React.lazy(() => import('@/pages/agentic-services/agentic-service-update'));
const AgenticServiceInfo = React.lazy(() => import('@/pages/agentic-services/agentic-service-info'));

// Policies
const Policies = React.lazy(() => import('@/pages/policies/policies'));
const CreatePolicies = React.lazy(() => import('@/pages/policies/policies-create'));
const PolicyInfo = React.lazy(() => import('@/pages/policies/policies-info'));
const UpldatePolicies = React.lazy(() => import('@/pages/policies/policies-update'));

// Verify Identity
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
      ),
      disabled: true // This route is disabled by default, can be enabled later
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
  const {isEmptyIdp, isAdmin} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp,
      isAdmin: state.isAdmin
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
            path: PATHS.agenticServices.add,
            element: <AddAgenticService />,
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
            path: PATHS.policies.info,
            element: <PolicyInfo />
          },
          {
            path: PATHS.policies.update,
            element: <UpldatePolicies />
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
                element: <IdentityProvider />
              },
              {
                path: PATHS.settings.identityProvider.connection,
                element: <ConnectionIdentityProvider />,
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
            element: <ApiKey />
          },
          {
            path: PATHS.settings.organizationsAndUsers.base,
            children: [
              {
                index: true,
                element: <Organizations />
              },
              {
                path: PATHS.settings.organizationsAndUsers.edit,
                element: <EditOrganization />,
                disabled: !isAdmin
              },
              {
                path: PATHS.settings.organizationsAndUsers.info,
                element: <OrganizationInfo />,
                disabled: !isAdmin
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
  }, [isAdmin, isEmptyIdp, isTbacEnable]);

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
