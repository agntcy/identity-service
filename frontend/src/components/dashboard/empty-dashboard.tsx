/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Link, Typography} from '@outshift/spark-design';
import EmptyState from '@/assets/empty-state.svg?react';
import {CheckIcon, PlusIcon} from 'lucide-react';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {PATHS} from '@/router/paths';
import {Link as RouterLink} from 'react-router-dom';
import {docs} from '@/utils/docs';
import {WelcomeName} from './welcome-name';
import {useAnalytics} from '@/hooks';

export const EmptyDashboard = () => {
  const {analyticsTrack} = useAnalytics();
  return (
    <ScrollShadowWrapper>
      <div className="flex flex-col h-full gap-[16px]">
        <WelcomeName />
        <div className="dashboard-card mx-6 mb-6">
          <div className="dashboard-card-content flex flex-col items-center justify-center h-full pt-4 gap-[12px]">
            <div className="px-4 md:px-0">
              <div className="flex justify-center items-center h-full">
                <EmptyState className="w-[200px] h-[200px]" />
              </div>
              <Typography variant="h6" textAlign="center">
                Get started with AGNTCY&apos;s Agent Identity
              </Typography>
            </div>
            <div className="text-center mx-auto pb-4 md:pb-0">
              <Typography textAlign="center" variant="body1" maxWidth="70%" sx={{margin: '0 auto'}}>
                Secure your AI agents and MCP servers with trusted identities. Create, verify, and manage agent identities
                for secure communication and authentication.{' '}
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
            <div className="gap-4 w-full px-4 pb-4 mt-4 hidden md:flex">
              <div className="bg-[#FBFCFE] rounded-[8px] flex-col flex justify-center items-center px-20 w-[50%] pt-[40px] pb-[24px]">
                <div>
                  <Typography variant="h6" textAlign="center">
                    Verify Identity Badges
                  </Typography>
                  <Typography variant="body1" marginTop={2} textAlign="center">
                    Ensure secure communication and authentication by verifying identities for your MCP servers and AI
                    agents, including those supporting A2A-compatible protocols like Google A2A.
                  </Typography>
                  <div className="flex justify-center items-center mt-8">
                    <RouterLink
                      to={PATHS.verifyIdentity.base}
                      onClick={() => analyticsTrack('CLICK_NAVIGATION_VERIFY_IDENTITY')}
                    >
                      <Button
                        variant="outlined"
                        sx={{fontWeight: '600 !important'}}
                        startIcon={<CheckIcon className="w-4 h-4" />}
                      >
                        Verify Identity
                      </Button>
                    </RouterLink>
                  </div>
                </div>
              </div>
              <div className="bg-[#FBFCFE] rounded-[8px] flex-col flex justify-center items-center px-20 w-[50%] pt-[40px] pb-[24px]">
                <div>
                  <Typography variant="h6" textAlign="center">
                    Create Badges & Policies
                  </Typography>
                  <Typography variant="body1" marginTop={2} textAlign="center">
                    Connect your identity provider to create and manage identities for your AI agents and MCP servers,
                    including those supporting A2A-compatible protocols like Google A2A, with support for policies and access
                    controls.
                  </Typography>
                  <div className="flex justify-center items-center mt-8">
                    <RouterLink
                      to={PATHS.settings.identityProvider.connection}
                      onClick={() => analyticsTrack('CLICK_NAVIGATION_CONNECT_IDENTITY_PROVIDER')}
                    >
                      <Button
                        variant="outlined"
                        sx={{fontWeight: '600 !important'}}
                        startIcon={<PlusIcon className="w-4 h-4" />}
                      >
                        Connect Identity Provider
                      </Button>
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollShadowWrapper>
  );
};
