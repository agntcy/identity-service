/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Header, Typography} from '@outshift/spark-design';
import {Link} from 'react-router-dom';
import Logo from '@/assets/logo-app-bar.svg';
import {useAuth} from '@/hooks';
import {ReactNode} from 'react';

export const PublicHeader = ({userSection}: {userSection?: ReactNode}) => {
  const {login, register} = useAuth();
  return (
    <Header
      title={
        <Typography variant="h1" fontWeight={700} fontSize="18px" lineHeight="18px" sx={(theme) => ({color: theme.palette.vars.brandTextSecondary})}>
          Agent Identity
        </Typography>
      }
      logo={
        <Link to="https://agntcy.org/" target="_blank" rel="noopener noreferrer">
          <img src={Logo} alt="Identity" />
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
