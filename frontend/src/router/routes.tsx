/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Route} from '@/types/router';
import {useCallback, useMemo} from 'react';
import {PATHS} from './paths';
import {NodeRoute} from '@/components/router/node-route';
import NotFound from '@/components/router/404';
import {Navigate} from 'react-router-dom';
import React from 'react';
import {Loading} from '@/components/ui/loading';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {useWindowSize} from '@/hooks';
import {SecureRoute} from '@/components/router/secure-route/secure-route';
import {isMultiTenant} from '@/utils/auth';

// Components
const Layout = React.lazy(() => import('@/components/layout/layout'));
const SettingsProvider = React.lazy(() => import('@/providers/settings-provider/settings-provider'));

// Welcome
const Welcome = React.lazy(() => import('@/pages/welcome/welcome'));

// Settings Identity Provider
const InfoIdentityProvider = React.lazy(() => import('@/pages/settings/identity-provider/info/info-identity-provider'));
const ConnectionIdentityProvider = React.lazy(
  () => import('@/pages/settings/identity-provider/connection-identity-provider/connection-identity-provider')
);

// Dashboard
const Dashboard = React.lazy(() => import('@/pages/dashboard/dashboard'));

// Settings Base
const SettingsBase = React.lazy(() => import('@/pages/settings/base/settings-base'));

// Settings API Key
const ApiKey = React.lazy(() => import('@/pages/settings/api-key/api-key'));

// Settings Devices
const Devices = React.lazy(() => import('@/pages/settings/devices/devices'));
const OnBoardDevice = React.lazy(() => import('@/pages/onboard-device/onboard-device'));

// Settings Organizations
const Organizations = React.lazy(() => import('@/pages/settings/organizations/base/organizations'));
const EditOrganization = React.lazy(() => import('@/pages/settings/organizations/edit/edit-organization'));
const InfoOrganization = React.lazy(() => import('@/pages/settings/organizations/info/info-organization'));

// Agentic Services
const AgenticServices = React.lazy(() => import('@/pages/agentic-services/agentic-services'));
const AddAgenticService = React.lazy(() => import('@/pages/agentic-services/add-agentic-service'));
const EditAgenticService = React.lazy(() => import('@/pages/agentic-services/edit-agentic-service'));
const InfoAgenticService = React.lazy(() => import('@/pages/agentic-services/info/info-agentic-service'));
const AboutAgenticService = React.lazy(() => import('@/pages/agentic-services/info/about-agentic-service'));
const PoliciesAssignedToAgenticService = React.lazy(
  () => import('@/pages/agentic-services/info/policies-assigned-to-agentic-service')
);
const PoliciesUsedByAgenticService = React.lazy(
  () => import('@/pages/agentic-services/info/policies-used-by-agentic-service')
);

// Policies
const Policies = React.lazy(() => import('@/pages/policies/policies'));
const AddPolicy = React.lazy(() => import('@/pages/policies/add-policy'));
const InfoPolicy = React.lazy(() => import('@/pages/policies/info-policy'));
const EditPolicy = React.lazy(() => import('@/pages/policies/edit-policy'));

// Verify Identity
const VerifyIdentity = React.lazy(() => import('@/pages/verify-identity/verify-identity'));

export const generateRoutes = (routes: Route[]): Route[] => {
  return [
    {
      path: PATHS.welcome,
      element: (
        <NodeRoute pageTitle="welcome">
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
      path: PATHS.onboardDevice.base,
      children: [
        {
          index: true,
          element: (
            <NodeRoute pageTitle="onboard device">
              <OnBoardDevice />
            </NodeRoute>
          )
        },
        {
          path: '*',
          element: <NotFound />
        }
      ]
    },
    {
      path: PATHS.basePath,
      element: (
        <SecureRoute redirectPath={PATHS.welcome}>
          <NodeRoute>
            <SettingsProvider>
              <Layout />
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

  const {isMobile} = useWindowSize();

  const isMulti = isMultiTenant();

  const routes = useMemo<Route[]>(() => {
    return [
      {
        path: PATHS.dashboard,
        children: [
          {
            index: true,
            element: (
              <NodeRoute pageTitle="dashboard">
                <Dashboard />
              </NodeRoute>
            )
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.agenticServices.base,
        disabled: isMobile,
        children: [
          {
            index: true,
            element: (
              <NodeRoute pageTitle="agentic services">
                <AgenticServices />
              </NodeRoute>
            )
          },
          {
            path: PATHS.agenticServices.add,
            element: (
              <NodeRoute pageTitle="add agentic service">
                <AddAgenticService />
              </NodeRoute>
            ),
            disabled: isEmptyIdp
          },
          {
            path: PATHS.agenticServices.edit,
            element: (
              <NodeRoute pageTitle="edit agentic service">
                <EditAgenticService />
              </NodeRoute>
            ),
            disabled: isEmptyIdp
          },
          {
            path: PATHS.agenticServices.info.base,
            element: (
              <NodeRoute>
                <InfoAgenticService />
              </NodeRoute>
            ),
            disabled: isEmptyIdp,
            children: [
              {
                index: true,
                element: (
                  <NodeRoute pageTitle="agentic service about">
                    <AboutAgenticService />
                  </NodeRoute>
                )
              },
              {
                path: PATHS.agenticServices.info.policiesAssignedTo,
                element: (
                  <NodeRoute pageTitle="agentic service policies assigned to">
                    <PoliciesAssignedToAgenticService />
                  </NodeRoute>
                )
              },
              {
                path: PATHS.agenticServices.info.policiesUsedBy,
                element: (
                  <NodeRoute pageTitle="agentic service policies used by">
                    <PoliciesUsedByAgenticService />
                  </NodeRoute>
                )
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
        path: PATHS.verifyIdentity.base,
        disabled: isMobile,
        children: [
          {
            index: true,
            element: (
              <NodeRoute pageTitle="verify identity">
                <VerifyIdentity />
              </NodeRoute>
            )
          },
          {
            path: PATHS.verifyIdentity.info,
            element: (
              <NodeRoute pageTitle="verify identity info">
                <VerifyIdentity />
              </NodeRoute>
            )
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.policies.base,
        disabled: isMobile,
        children: [
          {
            index: true,
            element: (
              <NodeRoute pageTitle="policies">
                <Policies />
              </NodeRoute>
            )
          },
          {
            path: PATHS.policies.create,
            element: (
              <NodeRoute pageTitle="add policy">
                <AddPolicy />
              </NodeRoute>
            )
          },
          {
            path: PATHS.policies.info,
            element: (
              <NodeRoute pageTitle="policy info">
                <InfoPolicy />
              </NodeRoute>
            )
          },
          {
            path: PATHS.policies.edit,
            element: (
              <NodeRoute pageTitle="edit policy">
                <EditPolicy />
              </NodeRoute>
            )
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.settings.base,
        disabled: isMobile,
        element: (
          <NodeRoute>
            <SettingsBase />
          </NodeRoute>
        ),
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
                element: (
                  <NodeRoute pageTitle="identity provider">
                    <InfoIdentityProvider />
                  </NodeRoute>
                )
              },
              {
                path: PATHS.settings.identityProvider.connection,
                element: (
                  <NodeRoute pageTitle="connect identity provider">
                    <ConnectionIdentityProvider />
                  </NodeRoute>
                ),
                disabled: !isEmptyIdp
              },
              {
                path: '*',
                element: <NotFound />
              }
            ]
          },
          {
            path: PATHS.settings.devices.base,
            disabled: isMobile,
            children: [
              {
                index: true,
                element: (
                  <NodeRoute pageTitle="devices">
                    <Devices />
                  </NodeRoute>
                )
              },
              {
                path: '*',
                element: <NotFound />
              }
            ]
          },
          {
            path: PATHS.settings.apiKey,
            disabled: isMobile,
            element: (
              <NodeRoute pageTitle="api key">
                <ApiKey />
              </NodeRoute>
            )
          },
          {
            path: PATHS.settings.organizationsAndUsers.base,
            disabled: !isMulti,
            children: [
              {
                index: true,
                element: (
                  <NodeRoute pageTitle="organizations">
                    <Organizations />
                  </NodeRoute>
                )
              },
              {
                path: PATHS.settings.organizationsAndUsers.edit,
                element: (
                  <NodeRoute pageTitle="edit organization">
                    <EditOrganization />
                  </NodeRoute>
                ),
                disabled: !isAdmin
              },
              {
                path: PATHS.settings.organizationsAndUsers.info,
                element: (
                  <NodeRoute pageTitle="organization info">
                    <InfoOrganization />
                  </NodeRoute>
                ),
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
  }, [isAdmin, isEmptyIdp, isMobile, isMulti]);

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
