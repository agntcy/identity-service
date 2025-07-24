/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ContentApiKey} from '@/components/api-key/content-api-key';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import React from 'react';
import {useOutletContext} from 'react-router-dom';

const ApiKey: React.FC = () => {
  const {subNav} = useOutletContext<{subNav: {label: string; href: string}[]}>();

  return (
    <BasePage
      title="API Key"
      subNav={subNav}
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'API Key'
        }
      ]}
    >
      <ContentApiKey />
    </BasePage>
  );
};

export default ApiKey;
