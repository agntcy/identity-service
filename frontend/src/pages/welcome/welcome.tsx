/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Divider, Link, Typography} from '@outshift/spark-design';
import OutshiftLogo from '@/assets/outshift-logo.svg';
import {CheckIcon} from 'lucide-react';
import {useAuth} from '@/hooks';
import {PublicHeader} from '@/components/layout/public-header';
import {Link as RouterLink} from 'react-router-dom';
import {docs} from '@/utils/docs';
import '@/styles/welcome.css';
import {PATHS} from '@/router/paths';

const Welcome = () => {
  const {login, register} = useAuth();
  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll h-screen">
      <PublicHeader />
      <div className="h-[56px]" />
      <div className="welcome-bg h-full">
        <div className="flex justify-center items-center ">
          <div className="mt-[50px]">
            <Typography
              fontSize={40}
              fontWeight={400}
              fontFamily={'Inter'}
              letterSpacing={'-2.49px'}
              lineHeight={'64px'}
              className="text-center mb-4"
              color="#161616"
            >
              Get started with AGNTCY&apos;s
            </Typography>
            <Typography
              fontFamily={'Inter'}
              fontSize={66}
              fontWeight={700}
              letterSpacing={'-2.49px'}
              lineHeight={'66px'}
              className="text-center mb-4"
              color="#161616"
            >
              Agent Identity
            </Typography>
          </div>
        </div>
        <div className="flex justify-center items-center mt-[50px]">
          <div className="welcome-card text-center flex flex-col items-center justify-center">
            <div>
              <Typography textAlign="center" variant="body1" paddingTop={2}>
                Start using Agent Identity&apos;s features by verifying existing identity badges or registering your Agentic Services (A2A Agents, MCP
                Servers, OASF).
              </Typography>
              <Link
                href={docs()}
                openInNewTab
                fontStyle={{
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  letterSpacing: '0.01em'
                }}
              >
                Learn more in our documentation.
              </Link>
            </div>
            <div className="w-full flex justify-center gap-6 mt-8">
              <div className="w-[50%] py-6 relative">
                <Typography variant="h6">Verify Identities</Typography>
                <Typography variant="body1" marginTop={2}>
                  Begin verifying your MCP Servers, A2A Agents and OASF identities.
                </Typography>
                <div className="absolute bottom-10 transform translate-y-1/2 left-1/2 -translate-x-1/2 w-full">
                  <RouterLink to={PATHS.verifyIdentity}>
                    <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<CheckIcon className="w-4 h-4" />}>
                      Verify Identity
                    </Button>
                  </RouterLink>
                </div>
                <div className="h-[50px]"></div>
              </div>
              <div>
                <Divider orientation="vertical" sx={{height: '37%', margin: '0 auto'}} />
                <Typography padding={'16px 0'} variant="subtitle1" color="#1A1F27">
                  or
                </Typography>
                <Divider orientation="vertical" sx={{height: '37%', margin: '0 auto'}} />
              </div>
              <div className="w-[50%] py-6 relative">
                <Typography variant="h6">Create Identities</Typography>
                <Typography variant="body1" marginTop={2}>
                  Add Agentic Services (MCP Servers, A2A Agents and OASF) to create, manage identities & TBAC Rules and Policies.
                </Typography>
                <div className="absolute bottom-10 transform translate-y-1/2 left-1/2 -translate-x-1/2 w-full">
                  <div className="flex justify-center items-center gap-4">
                    <Button variant="secondary" onClick={() => login?.()} sx={{fontWeight: '600 !important'}}>
                      Log In
                    </Button>
                    <Button onClick={() => register?.()} sx={{fontWeight: '600 !important'}}>
                      Sign Up
                    </Button>
                  </div>
                </div>
                <div className="h-[50px]"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0">
          <img src={OutshiftLogo} alt="Outshift Logo" className="w-[355px] h-[320px]" />
        </div>
      </div>
    </div>
  );
};

export default Welcome;
