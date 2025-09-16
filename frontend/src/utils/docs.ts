/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import config from '@/config';

export const docs = (section?: string) => {
  const baseUrl = config.DOCS_URL + '/docs';
  if (!section) {
    return baseUrl + "/intro";
  }

  if (section) {
    return `${baseUrl}/${section}`;
  }

  return baseUrl;
};
