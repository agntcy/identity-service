/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* c8 ignore start */

import {useMemo} from 'react';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import {useRoutes} from './routes';
import config from '@/config';

export const Router = () => {
  const routes = useRoutes();
  const router = useMemo(() => createBrowserRouter(routes, {basename: config.APP_BASE_NAME}), [routes]);
  return <RouterProvider router={router} />;
};

/* c8 ignore stop */
