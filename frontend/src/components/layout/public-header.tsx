/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Header} from '@open-ui-kit/core';
import {useAuth} from '@/hooks';
import {ReactNode} from 'react';
import Logo from '@/assets/header/header.svg?react';
import outshiftLogo from '@/assets/outshift/logo-color.svg';

export const PublicHeader = ({userSection}: {userSection?: ReactNode}) => {
  const {login, register} = useAuth();
  return (
    <Header
      logo={
        <div className="flex items-center gap-2 md:gap-2 lg:gap-0">
          <div className="w-20 lg:w-34">
            <img src={outshiftLogo} alt="Logo" className="w-full" />
          </div>
          <Logo className="w-[200px] md:w-[250px] lg:w-full" data-testid="header-logo-svg" />
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
