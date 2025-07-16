/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Header, Typography} from '@outshift/spark-design';
import {Link} from 'react-router-dom';
import Logo from '@/assets/logo-app-bar.svg?react';
import LogoIcon from '@/assets/icon-agntcy.svg?react';
import {useAuth, useWindowSize} from '@/hooks';
import {ReactNode} from 'react';
import {PATHS} from '@/router/paths';

export const PublicHeader = ({userSection}: {userSection?: ReactNode}) => {
  const {login, register} = useAuth();
  const {width} = useWindowSize();
  const isMobile = width < 768;

  return (
    <Header
      title={
        <Link to={PATHS.basePath}>
          <div className="mt-1 md:mt-0">
            <Typography
              variant="h1"
              fontWeight={700}
              fontSize={isMobile ? '16px' : '18px'}
              lineHeight="18px"
              sx={(theme) => ({color: theme.palette.vars.brandTextSecondary})}
            >
              Agent Identity
            </Typography>
          </div>
        </Link>
      }
      logo={
        <Link to="https://agntcy.org/" target="_blank" rel="noopener noreferrer">
          <Logo className="hidden md:block" />
          <LogoIcon className="w-8 h-8 md:hidden" />
        </Link>
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
