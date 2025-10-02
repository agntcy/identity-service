/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Link, Typography} from '@open-ui-kit/core';
import {useAnalytics, useAuth} from '@/hooks';
import {docs} from '@/utils/docs';
import LandingLogo from '@/assets/welcome/landing.svg?react';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {globalConfig} from '@/config/global';
import '@/styles/welcome.css';

const Welcome = () => {
  const {login, register} = useAuth();
  const {analyticsTrack} = useAnalytics();
  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 bg-[#00142B] relative">
      <div>
        <div className="flex items-center justify-center h-screen">
          <div className="space-y-4 md:space-y-6 lg:space-y-10">
            <div className="space-y-10">
              <div className="welcome-title mx-auto w-fit font-[400] leading-[34px] md:leading-[64px] text-[25px] md:text-[50px] lg:text-[60px]">
                Get started with
              </div>
              <div className="flex justify-center items-center gap-2 md:gap-4">
                <div>
                  <img
                    src="/logo-welcome.svg"
                    alt="logo"
                    className="h-[30px] md:h-[50px] lg:h-[70px]"
                    data-testid="landing-logo"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/logo.svg';
                    }}
                  />
                </div>
                {globalConfig.poweredBy ? (
                  <LandingLogo className="max-w-[250px] md:max-w-[500px] lg:max-w-[914px] max-h-[54px] md:max-h-[104px] lg:max-h-full" />
                ) : (
                  <Typography color="white" variant="h1">
                    <span className="text-[22px] md:text-[48px] lg:text-[58px]">Identity Service</span>
                  </Typography>
                )}
              </div>
            </div>
            <div className="welcome-main-card mx-auto max-w-[350px] md:max-w-[700px] lg:max-w-[914px] h-fit md:h-[350px] px-4 md:px-8 lg:px-[80px] flex flex-col justify-center items-center">
              <div className="space-y-4 md:space-y-8">
                <div className="text-center mx-auto">
                  <Typography variant="h5" color="#FBFCFE" paddingBottom={1}>
                    <span className="text-[20px] md:text-[24px]">Create Badges & Policies</span>
                  </Typography>
                  <div className="md:pt-2 max-w-full lg:max-w-[80%] text-center mx-auto">
                    <Typography textAlign="center" variant="body1" color="#FBFCFE" sx={{margin: '0 auto'}}>
                      <span className="text-[14px] md:text-[16px]">
                        Register your AI agents and MCP servers, including those supporting A2A-compatible protocols like
                        Google A2A, to create and manage identities with support for policies and access controls.
                      </span>
                    </Typography>
                  </div>
                  <Link
                    href={docs()}
                    openInNewTab
                    fontStyle={{
                      fontWeight: 400,
                      lineHeight: '24px',
                      letterSpacing: '0.01em',
                      color: '#FBAF45'
                    }}
                    style={{color: '#FBAF45'}}
                  >
                    <span className="text-[12px] md:text-[16px]">Learn more in our documentation.</span>
                  </Link>
                </div>
                <div className="flex justify-center items-center gap-4 pt-6 md:pt-0">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      analyticsTrack('CLICK_LOGIN');
                      login?.();
                    }}
                    sx={{
                      fontWeight: '600 !important',
                      color: '#FBFCFE !important',
                      borderRadius: '1000px !important'
                    }}
                  >
                    <span className="text-[12px] md:text-[16px] text-[#FBAF45]">Log In</span>
                  </Button>
                  <Button
                    onClick={() => {
                      analyticsTrack('CLICK_SIGN_UP');
                      register?.();
                    }}
                    sx={{
                      fontWeight: '600 !important',
                      background: '#FBAF45 !important',
                      color: '#00142B',
                      borderRadius: '1000px !important'
                    }}
                    variant="primary"
                  >
                    <span className="text-[12px] md:text-[16px]">Sign Up</span>
                  </Button>
                </div>
                <div className="flex justify-center gap-4 mx-auto pt-8 md:pt-2">
                  <Link
                    href={globalConfig.links.termsAndConditions}
                    openInNewTab
                    fontStyle={{
                      fontWeight: 400,
                      lineHeight: '24px',
                      letterSpacing: '0.01em',
                      color: '#FBAF45'
                    }}
                    style={{color: '#FBAF45'}}
                  >
                    <span className="text-[10px] md:text-[12px]">Terms & Conditions</span>
                  </Link>
                  <Link
                    href={globalConfig.links.privacyPolicy}
                    openInNewTab
                    fontStyle={{
                      fontWeight: 400,
                      lineHeight: '24px',
                      letterSpacing: '0.01em',
                      color: '#FBAF45'
                    }}
                    style={{color: '#FBAF45'}}
                  >
                    <span className="text-[10px] md:text-[12px]">Privacy Policy</span>
                  </Link>
                  <Link
                    fontStyle={{
                      fontWeight: 400,
                      lineHeight: '24px',
                      letterSpacing: '0.01em',
                      color: '#FBAF45'
                    }}
                    onClick={() => CookieConsentVanilla.showPreferences()}
                    style={{color: '#FBAF45'}}
                  >
                    <span className="text-[10px] md:text-[12px]">Cookie Preferences</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
