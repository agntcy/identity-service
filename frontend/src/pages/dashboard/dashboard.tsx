/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Link, Typography} from '@outshift/spark-design';
import EmptyState from '@/assets/empty-state.svg';
import {CheckIcon, PlusIcon} from 'lucide-react';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {PATHS} from '@/router/paths';
import {useAuth} from '@/hooks';
import {Link as RouterLink} from 'react-router-dom';
import '@/styles/dashboard.css';

const Dashboard: React.FC = () => {
  const {authInfo} = useAuth();

  return (
    <ScrollShadowWrapper>
      <div className="flex flex-col h-full gap-[24px]">
        <div className="w-full h-[184px] bg-[#00142B] flex flex-col justify-between sticky top-0 z-10">
          <div className="flex justify-center items-center my-auto">
            <div>
              <Typography variant="h3" textAlign="center" sx={(theme) => ({color: theme.palette.vars.brandIconTertiaryDefault})}>
                Welcome to Agntcy Identity, {authInfo?.user?.name || 'User'}!
              </Typography>
              <Typography variant="body1" textAlign="center" sx={(theme) => ({color: theme.palette.vars.baseTextInverse})}>
                Create and manage identities for your A2A, agents and MCP servers
              </Typography>
            </div>
          </div>
          <div className="striped-bar" />
        </div>
        <div className="dashboard-card mx-6 mb-6">
          <div className="dashboard-card-content flex flex-col items-center justify-center h-full pt-4 gap-[12px]">
            <div>
              <div className="flex justify-center items-center h-full">
                <img src={EmptyState} alt="Empty State" className="w-[200px] h-[200px]" />
              </div>
              <Typography variant="h6">Get started with Agntcy Identity</Typography>
            </div>
            <div className="text-center">
              <Typography textAlign="center" paddingLeft={4} paddingRight={4} variant="body1">
                Start using Agntcy Identity&apos;s features by verifying existing identity badges or registering your agents (A2A, MCP servers,
                agents).
              </Typography>
              <Typography textAlign="center" paddingLeft={4} paddingRight={4} variant="body1">
                This enables you to create identities and apply tool-based access control for secure and efficient management.
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
            <div className="flex gap-4 w-full px-4 pb-4 mt-4">
              <div className="bg-[#FBFCFE] rounded-[8px] flex-col flex justify-center items-center px-20 w-[50%] pt-[40px] pb-[24px]">
                <div>
                  <Typography variant="h6" textAlign="center">
                    Verify Identities
                  </Typography>
                  <Typography variant="body1" marginTop={2} textAlign="center">
                    Begin verifying your MCP servers, agents, and A2A identities to ensure secure communication and proper authentication across your
                    environment.
                  </Typography>
                  <div className="flex justify-center items-center mt-8">
                    <RouterLink to={PATHS.agenticServices.verifyIdentity}>
                      <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<CheckIcon className="w-4 h-4" />}>
                        Verify Identity
                      </Button>
                    </RouterLink>
                  </div>
                </div>
              </div>
              <div className="bg-[#FBFCFE] rounded-[8px] flex-col flex justify-center items-center px-20 w-[50%] pt-[40px] pb-[24px]">
                <div>
                  <Typography variant="h6" textAlign="center">
                    Register Identity Providers
                  </Typography>
                  <Typography variant="body1" marginTop={2} textAlign="center">
                    Register identity provider to create and manage identities for your AI agents and MCP servers, including those supporting
                    A2A-compatible protocols like Google A2A, with support for policies and access controls.
                  </Typography>
                  <div className="flex justify-center items-center mt-8">
                    <RouterLink to={PATHS.settings.identityProvider.base}>
                      <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<PlusIcon className="w-4 h-4" />}>
                        Register Identity Provider
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

export default Dashboard;
