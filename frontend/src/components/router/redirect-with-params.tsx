/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

/* c8 ignore start */

import React from 'react';
import {Navigate, NavigateProps, generatePath, useParams} from 'react-router-dom';

interface RedirectWithParamsProps extends Omit<NavigateProps, 'to'> {
  to: string;
}

export const RedirectWithParams: React.FC<RedirectWithParamsProps> = ({to, ...props}) => {
  const params = useParams();
  const redirectWithParams = generatePath(to, params);
  return <Navigate to={redirectWithParams} {...props} />;
};

/* c8 ignore end */
