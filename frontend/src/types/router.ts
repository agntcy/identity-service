/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {RouteObject} from 'react-router-dom';

export interface CustomRoute {
  disabled?: boolean;
}

export type Route = RouteObject & CustomRoute;
