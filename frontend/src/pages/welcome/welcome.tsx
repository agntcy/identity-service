/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Divider, Link, Typography} from '@outshift/spark-design';
import {CheckIcon} from 'lucide-react';
import {useAuth} from '@/hooks';
import {Link as RouterLink} from 'react-router-dom';
import {docs} from '@/utils/docs';
import {PATHS} from '@/router/paths';
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
          <div className="welcome-main-card mx-auto max-w-[1000px] px-[80px]">
            <div className="text-center mx-auto">
              <Typography textAlign="center" variant="body1" paddingTop={2} color="#FBFCFE">
                Secure your AI agents and MCP servers with trusted identities. Create, verify, and manage agent identities for secure communication
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
            <div className="flex justify-center items-center z-10 relative mt-6">
              <div className="w-full flex justify-center gap-12">
                <div className="py-6 relative text-center">
                  <Typography variant="h6" color="#FBFCFE">
                    Verify Identity Badges
                  </Typography>
                  <Typography variant="body1" marginTop={2} marginBottom={2} color="#FBFCFE">
                    Ensure secure communication and authentication by verifying identities for your MCP servers and AI agents, including those
                    supporting A2A-compatible protocols like Google A2A.
                  </Typography>
                  <div className="absolute bottom-10 transform translate-y-1/2 left-1/2 -translate-x-1/2 w-full">
                    <RouterLink to={PATHS.verifyIdentity}>
                      <Button
                        variant="outlined"
                        sx={{fontWeight: '600 !important', color: '#FBFCFE !important'}}
                        startIcon={<CheckIcon className="w-4 h-4" />}
                      >
                        Verify Identity
                      </Button>
                    </RouterLink>
                  </div>
                  <div className="h-[50px]"></div>
                </div>
                <div>
                  <Divider orientation="vertical" sx={{height: '37%', margin: '0 auto'}} />
                  <Typography padding={'16px 0'} variant="subtitle1" color="#FBFCFE">
                    or
                  </Typography>
                  <Divider orientation="vertical" sx={{height: '37%', margin: '0 auto'}} />
                </div>
                <div className="py-6 relative text-center">
                  <Typography variant="h6" color="#FBFCFE">
                    Register Agents
                  </Typography>
                  <Typography variant="body1" marginTop={2} marginBottom={2} color="#FBFCFE">
                    Register your AI agents and MCP servers, including those supporting A2A-compatible protocols like Google A2A, to create and manage
                    identities with support for policies and access controls.
                  </Typography>
                  <div className="absolute bottom-10 transform translate-y-1/2 left-1/2 -translate-x-1/2 w-full">
                    <div className="flex justify-center items-center gap-4">
                      <Button variant="outlined" onClick={() => login?.()} sx={{fontWeight: '600 !important', color: '#FBFCFE !important'}}>
                        Log In
                      </Button>
                      <Button
                        onClick={() => register?.()}
                        sx={{fontWeight: '600 !important', background: '#FBAF45 !important', color: '#00142B'}}
                        variant="primary"
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                  <div className="h-[50px]"></div>
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
