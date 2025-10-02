/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateIdentityProvider} from '@/components/identity-provider/create/create-identity-provider';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {IconButton, Tooltip} from '@mui/material';
import {InfoIcon} from 'lucide-react';

const ConnectionIdentityProvider: React.FC = () => {
  return (
    <BasePage
      title={
        <div className="flex items-center gap-2">
          <span>Identity Provider Connection</span>
          <Tooltip
            title={
              <div className="text-center">
                In the first release, you can link a single identity provider as an issuer, but it won&apos;t be possible to
                edit or remove it.
              </div>
            }
            arrow
            placement="right"
          >
            <IconButton
              sx={(theme) => ({
                color: theme.palette.vars.baseTextDefault,
                width: '24px',
                height: '24px'
              })}
            >
              <InfoIcon className="w-4 h-4" />
            </IconButton>
          </Tooltip>
        </div>
      }
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'Identity Provider',
          link: PATHS.settings.identityProvider.base
        },
        {
          text: 'Connection'
        }
      ]}
    >
      <CreateIdentityProvider />
    </BasePage>
  );
};

export default ConnectionIdentityProvider;
