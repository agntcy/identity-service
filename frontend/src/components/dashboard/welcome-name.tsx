/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useAuth, useWindowSize} from '@/hooks';
import {Typography} from '@outshift/spark-design';

export const WelcomeName = () => {
  const {authInfo} = useAuth();
  const {isMobile} = useWindowSize();
  return (
    <div className="bg-[#00142B] h-full">
      <div className="w-full h-[200px] md:h-[184px] flex flex-col justify-between sticky top-0 z-0">
        <div className="flex justify-center items-center my-auto px-4 md:px-0">
          <div>
            <Typography
              variant={isMobile ? 'h5' : 'h3'}
              textAlign="center"
              sx={(theme) => ({color: theme.palette.vars.brandIconTertiaryDefault})}
            >
              Welcome to Agent Identity, <span className="capitalize">{authInfo?.user?.name || 'User'}!</span>
            </Typography>
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              textAlign="center"
              sx={(theme) => ({color: theme.palette.vars.baseTextInverse})}
            >
              Create and manage identities for your MCP Servers, A2A Agents and OASF
            </Typography>
          </div>
        </div>
        <div className="striped-bar" />
      </div>
    </div>
  );
};
