/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {HttpStatusCode} from 'axios';

export const httpErrors = {
  UNAUTHORIZED: HttpStatusCode.Unauthorized,
  FORBIDDEN: HttpStatusCode.Forbidden,
  BAD_REQUEST: HttpStatusCode.BadRequest,
  NOT_FOUND: HttpStatusCode.NotFound
};

export const USER_NOT_AUTH = 'user is not authorized';

export const httpErrorsAuth = [HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden];
