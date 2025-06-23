/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import useAuth from '@/providers/auth-provider/use-auth';
import {Button, Divider, Header, Link, Typography} from '@outshift/spark-design';
import Logo from '@/assets/logo-app-bar.svg';
import OutshiftLogo from '@/assets/outshift-logo.svg';
import {CheckIcon} from 'lucide-react';
import '@/styles/welcome.css';

const Welcome = () => {
  const {login, register} = useAuth();
  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll h-screen welcome-bg">
      <Header
        title={
          <Typography
            variant="h1"
            fontWeight={700}
            fontSize="18px"
            lineHeight="18px"
            sx={(theme) => ({color: theme.palette.vars.brandTextSecondary})}
          >
            Identity
          </Typography>
        }
        logo={
          <Link href="https://agntcy.org/" openInNewTab>
            <img src={Logo} alt="Identity" />
          </Link>
        }
        position="fixed"
        userSection={
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => login?.()} sx={{fontWeight: '600 !important'}}>
              Log In
            </Button>
            <Button onClick={() => register?.()} sx={{fontWeight: '600 !important'}}>
              Sign Up
            </Button>
          </div>
        }
        useDivider={false}
      />
      <div className="h-[56px]" />
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
            Get started with
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
            Agntcy Identity
          </Typography>
        </div>
      </div>
      <div className="flex justify-center items-center mt-[50px]">
        <div className="welcome-card text-center flex flex-col items-center justify-center">
          <div>
            <Typography textAlign="center" variant="body1" paddingTop={2}>
              Start using Agntcy Identity&apos;s features by verifying existing identity badges or registering your agents (A2A, MCP servers, agents).
            </Typography>
            <Link
              href="https://spec.identity.agntcy.org/"
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
              <Typography variant="h6">Verify identities</Typography>
              <Typography variant="body1" marginTop={2}>
                Begin verifying your MCP servers, agents, and A2A identities.
              </Typography>
              <div className="absolute bottom-10 transform translate-y-1/2 left-1/2 -translate-x-1/2 w-full">
                <Button variant="outlined" onClick={() => {}} sx={{fontWeight: '600 !important'}} startIcon={<CheckIcon className="w-4 h-4" />}>
                  Verify identity
                </Button>
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
              <Typography variant="h6">Create identities</Typography>
              <Typography variant="body1" marginTop={2}>
                Add agents (MCP servers, agents, and A2A) to create and manage identities & RBAC policies
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
  );
};

export default Welcome;
