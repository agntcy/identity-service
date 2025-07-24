/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Header, Typography} from '@outshift/spark-design';
import {Link} from 'react-router-dom';
import {useAuth, useWindowSize} from '@/hooks';
import {ReactNode} from 'react';
import {PATHS} from '@/router/paths';
import OutshiftLogo from '@/assets/outshift-color.svg?react';
import OutshiftIcon from '@/assets/outshift.svg?react';

export const PublicHeader = ({userSection}: {userSection?: ReactNode}) => {
  const {login, register} = useAuth();
  const {isMobile} = useWindowSize();

  return (
    <Header
      title={
        <Link to={PATHS.dashboard} className="mt-1 lg:ml-1">
          <Typography
            variant="h1"
            fontWeight={700}
            fontSize={isMobile ? '16px' : '18px'}
            lineHeight="18px"
            sx={() => ({color: 'black'})}
          >
            Agent Identity Service
          </Typography>
        </Link>
      }
      logo={
        <Link to="https://agntcy.org/" target="_blank" rel="noopener noreferrer">
          <OutshiftLogo className="h-[44px] hidden lg:block" />
          <OutshiftIcon className="h-[44px] w-[44px] lg:hidden" />
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
