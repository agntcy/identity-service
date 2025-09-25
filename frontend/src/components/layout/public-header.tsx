/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Header} from '@open-ui-kit/core';
import {useAuth} from '@/hooks';
import {ReactNode} from 'react';
import Logo from '@/assets/header/header.svg?react';

export const PublicHeader = ({userSection}: {userSection?: ReactNode}) => {
  const {login, register} = useAuth();
  return (
    <Header
      logo={
        <div className="flex items-center gap-2">
          <div className="w-12">
            <img
              src="/logo-header.svg"
              alt="logo"
              className="w-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/logo.svg';
              }}
            />
          </div>
          <Logo className="w-[200px] md:w-[300px] lg:w-full" data-testid="header-logo-svg" />
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
