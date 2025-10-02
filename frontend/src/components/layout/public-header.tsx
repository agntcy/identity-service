/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Header, Typography} from '@open-ui-kit/core';
import {useAuth} from '@/hooks';
import {ReactNode} from 'react';
import Logo from '@/assets/header/header.svg?react';
import {globalConfig} from '@/config/global';

export const PublicHeader = ({userSection}: {userSection?: ReactNode}) => {
  const {login, register} = useAuth();
  return (
    <Header
      logo={
        <div className="flex items-center gap-1 md:gap-3">
          <div>
            <img
              src="/logo-header.svg"
              alt="logo"
              className="h-[30px]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/logo.svg';
              }}
            />
          </div>
          {globalConfig.poweredBy ? (
            <Logo className="w-[200px] md:w-[300px] lg:w-full" data-testid="header-logo-svg" />
          ) : (
            <Typography variant="h6" color="black">
              Identity Service
            </Typography>
          )}
        </div>
      }
      position="fixed"
      userSection={
        !userSection ? (
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => login?.()} sx={{fontWeight: '600 !important'}}>
              Log In
            </Button>
            <Button onClick={() => register?.()} sx={{fontWeight: '600 !important'}}>
              Sign Up
            </Button>
          </div>
        ) : (
          userSection
        )
      }
      useDivider={false}
    />
  );
};
