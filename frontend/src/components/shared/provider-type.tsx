/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {cn} from '@/lib/utils';
import {Typography} from '@mui/material';
import {labels} from '@/constants/labels';
import DuoLogo from '@/assets/duo.svg?react';
import OktaLogo from '@/assets/okta.svg?react';
import OasfLogo from '@/assets/oasf.svg?react';
import {IdpType} from '@/types/api/settings';

export const ProviderType = ({type, className}: {type?: IdpType; className?: string}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {type === IdpType.IDP_TYPE_DUO && <DuoLogo className="h-[22px] w-[22px]" />}
      {type === IdpType.IDP_TYPE_OKTA && <OktaLogo className="h-[20px] w-[20px]" />}
      {type === IdpType.IDP_TYPE_SELF && <OasfLogo className="h-[20px] w-[20px]" />}
      <Typography
        variant="body1"
        fontSize={14}
        sx={(theme) => ({
          color: theme.palette.vars.baseTextStrong
        })}
      >
        {labels.providerTypes[type as keyof typeof labels.providerTypes] || 'Unknown Provider Type'}
      </Typography>
    </div>
  );
};
