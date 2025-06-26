/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  V1Alpha1App,
  V1Alpha1AppType,
  V1Alpha1AppTypeCountEntry,
  V1Alpha1GetAppsCountResponse,
  V1Alpha1ListAppsResponse,
  V1Alpha1PagedResponse
} from '@/api/generated/identity/app_service.swagger.api';

export type {
  V1Alpha1App as App,
  V1Alpha1AppTypeCountEntry as AppTypeCountEntry,
  V1Alpha1GetAppsCountResponse as GetAppsCountResponse,
  V1Alpha1ListAppsResponse as ListAppsResponse,
  V1Alpha1PagedResponse as PagedResponse
};

export {V1Alpha1AppType as AppType};
