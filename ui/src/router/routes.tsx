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

const Welcome = React.lazy(() => import('@/pages/welcome/welcome'));
const Applications = React.lazy(() => import('@/pages/applications/applications'));
const CreateApplication = React.lazy(() => import('@/pages/applications/create-application'));
const SettingsIdentityProvider = React.lazy(() => import('@/pages/settings/settings-identity-provider'));

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
      path: PATHS.basePath,
      element: (
        <SecureRoute redirectPath={PATHS.welcome}>
          <NodeRoute>
            <Layout />
          </NodeRoute>
        </SecureRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={PATHS.applications} replace />
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
  const routes = useMemo<Route[]>(() => {
    return [
      {
        path: PATHS.applications,
        children: [
          {
            index: true,
            element: <Applications />
          },
          {
            path: PATHS.applicationsCreate,
            element: <CreateApplication />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: PATHS.settings,
        children: [
          {
            index: true,
            element: <Navigate to={PATHS.settingsIdentityProvider} replace />
          },
          {
            path: PATHS.settingsIdentityProvider,
            element: <SettingsIdentityProvider />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
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
