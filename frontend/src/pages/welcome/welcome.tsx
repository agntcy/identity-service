/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Divider, Link, Typography} from '@outshift/spark-design';
import {useAuth} from '@/hooks';
import {docs} from '@/utils/docs';
import AgntcyLogo from '@/assets/agntcy-logo.svg?react';
import '@/styles/welcome.css';

const Welcome = () => {
  const {login, register} = useAuth();
  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll h-screen bg-[#00142B] relative">
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-12">
          <div className="flex gap-12 justify-center">
            <div className="welcome-title w-[394px] font-[400]">Get started with</div>
            <div className="px-1">
              <Divider orientation="vertical" sx={{margin: '0 auto'}} />
            </div>
            <div className="space-y-2">
              <AgntcyLogo className="w-[416px] h-[94px]" />
              <div className="welcome-product-name">Agent Identity</div>
            </div>
          </div>
          <div className="welcome-main-card mx-auto max-w-[914px] h-[350px] px-[80px] flex flex-col justify-center items-center">
            <div className="space-y-8">
              <div className="text-center mx-auto">
                <Typography variant="h5" color="#FBFCFE" paddingBottom={1}>
                  Create Badges & Policies
                </Typography>
                <Typography textAlign="center" variant="body1" paddingTop={2} color="#FBFCFE" maxWidth={'80%'} sx={{margin: '0 auto'}}>
                  Register your AI agents and MCP servers, including those supporting A2A-compatible protocols like Google A2A, to create and manage
                  identities with support for policies and access controls.
                </Typography>
                <Link
                  href={docs()}
                  openInNewTab
                  fontStyle={{
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '24px',
                    letterSpacing: '0.01em',
                    color: '#FBAF45'
                  }}
                  style={{color: '#FBAF45'}}
                >
                  Learn more in our documentation.
                </Link>
              </div>
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outlined"
                  onClick={() => login?.()}
                  sx={{fontWeight: '600 !important', color: '#FBFCFE !important', borderRadius: '1000px !important'}}
                >
                  <span className="text-[#FBAF45]">Log In</span>
                </Button>
                <Button
                  onClick={() => register?.()}
                  sx={{fontWeight: '600 !important', background: '#FBAF45 !important', color: '#00142B', borderRadius: '1000px !important'}}
                  variant="primary"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full">
        <div className="striped-bar" />
      </div>
    </div>
  );
};

export default Welcome;
