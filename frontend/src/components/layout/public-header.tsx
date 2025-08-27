/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Header} from '@outshift/spark-design';
import {Link} from 'react-router-dom';
import {useAuth} from '@/hooks';
import {ReactNode} from 'react';
import Logo from '@/assets/header/header.svg?react';

export const PublicHeader = ({userSection}: {userSection?: ReactNode}) => {
  const {login, register} = useAuth();
  return (
    <Header
      logo={
        <Link to="https://agntcy.org/" target="_blank" rel="noopener noreferrer">
          <Logo className="w-[250px] md:w-[300px] lg:w-full" />
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
