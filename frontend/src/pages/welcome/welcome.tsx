/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Link, Typography} from '@outshift/spark-design';
import {useAuth} from '@/hooks';
import {docs} from '@/utils/docs';
import LogoWelcome from '@/assets/logo-welcome.svg?react';
import PoweredLogo from '@/assets/powered-logo.svg?react';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import '@/styles/welcome.css';

const Welcome = () => {
  const {login, register} = useAuth();
  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 bg-[#00142B] relative">
      <div>
        <div className="flex items-center justify-center h-screen">
          <div className="space-y-8 md:space-y-12">
            <div className="space-y-4">
              <div className="welcome-title mx-auto w-fit font-[400] leading-[34px] md:leading-[64px] text-[25px] md:text-[50px] lg:text-[60px]">
                Get started with
              </div>
              <div className='flex justify-center items-center'>
                <div>
                  <LogoWelcome className="max-w-[350px] md:max-w-[700px] lg:max-w-[914px]  max-h-[44px] md:max-h-[74px] lg:max-h-[94px]" />
                  <div className="flex justify-end">
                    <PoweredLogo className="max-w-[150px] max-h-[20px] md:max-w-[220px] md:max-h-[30px] lg:max-w-[331px] lg:max-h-[35px]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="welcome-main-card mx-auto max-w-[350px] md:max-w-[700px] lg:max-w-[914px] h-fit md:h-[350px] px-[80px] flex flex-col justify-center items-center">
              <div className="space-y-8">
                <div className="text-center mx-auto">
                  <Typography variant="h5" color="#FBFCFE" paddingBottom={1}>
                    Create Badges & Policies
                  </Typography>
                  <div className="hidden md:block">
                    <Typography
                      textAlign="center"
                      variant="body1"
                      paddingTop={2}
                      color="#FBFCFE"
                      maxWidth={'80%'}
                      sx={{margin: '0 auto'}}
                    >
                      Register your AI agents and MCP servers, including those supporting A2A-compatible protocols like
                      Google A2A, to create and manage identities with support for policies and access controls.
                    </Typography>
                  </div>
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
                    sx={{
                      fontWeight: '600 !important',
                      color: '#FBFCFE !important',
                      borderRadius: '1000px !important'
                    }}
                  >
                    <span className="text-[#FBAF45]">Log In</span>
                  </Button>
                  <Button
                    onClick={() => register?.()}
                    sx={{
                      fontWeight: '600 !important',
                      background: '#FBAF45 !important',
                      color: '#00142B',
                      borderRadius: '1000px !important'
                    }}
                    variant="primary"
                  >
                    Sign Up
                  </Button>
                </div>
                <div className="flex justify-center gap-4 mx-auto">
                  <Link
                    href="https://www.cisco.com/c/en/us/about/legal/terms-conditions.html"
                    openInNewTab
                    fontStyle={{
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '24px',
                      letterSpacing: '0.01em',
                      color: '#FBAF45'
                    }}
                    style={{color: '#FBAF45'}}
                  >
                    Terms & Conditions
                  </Link>
                  <Link
                    href="https://www.cisco.com/c/en/us/about/legal/privacy-full.html"
                    openInNewTab
                    fontStyle={{
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '24px',
                      letterSpacing: '0.01em',
                      color: '#FBAF45'
                    }}
                    style={{color: '#FBAF45'}}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    fontStyle={{
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '24px',
                      letterSpacing: '0.01em',
                      color: '#FBAF45'
                    }}
                    onClick={() => CookieConsentVanilla.showPreferences()}
                    style={{color: '#FBAF45'}}
                  >
                    Cookies
                  </Link>
                </div>
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
