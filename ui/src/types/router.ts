/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {RouteObject} from 'react-router-dom';

export interface CustomRoute {
  disabled?: boolean;
}

export type Route = RouteObject & CustomRoute;
