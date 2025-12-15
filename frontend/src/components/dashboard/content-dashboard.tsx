/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Checkbox, Divider, Link, Typography} from '@open-ui-kit/core';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {PATHS} from '@/router/paths';
import {docs} from '@/utils/docs';
import {WelcomeName} from './welcome-name';
import {RadioButtonUnchecked, CheckCircle} from '@mui/icons-material';
import {useState} from 'react';
import {PlayButton} from './play-button';
import VideoThumbNail from '@/assets/dashboard/video-thumbnail.png';
import {useAnalytics} from '@/hooks';
import {useLocalStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

export const ContentDashboard = () => {
  const [showVideo, setShowVideo] = useState(false);

  const {analyticsTrack} = useAnalytics();

  const {addAgent, setAddAgent, setIdp, setSetIdp, createBadge, setCreateBadge, createPolicy, setCreatePolicy} =
    useLocalStore(
      useShallow((state) => ({
        addAgent: state.addAgent,
        setAddAgent: state.setAddAgent,
        setIdp: state.setIdp,
        setSetIdp: state.setSetIdp,
        createBadge: state.createBadge,
        setCreateBadge: state.setCreateBadge,
        createPolicy: state.createPolicy,
        setCreatePolicy: state.setCreatePolicy
      }))
    );

  return (
    <ScrollShadowWrapper>
      <div className="flex flex-col h-full gap-[16px] mb-12">
        <WelcomeName />
        <div className="dashboard-card mx-6 mb-6">
          <div className="dashboard-card-content flex flex-row items-start justify-center h-full pt-4 gap-4">
            <div className="hidden md:flex py-8 pb-12 space-y-4 max-w-[60%] flex-col items-center">
              <div className="w-full max-w-[700px] aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md mb-4 relative">
                {!showVideo ? (
                  <>
                    <div className="w-full h-full relative flex items-center justify-center">
                      <img
                        src={VideoThumbNail}
                        alt="Video thumbnail"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setShowVideo(true)}
                        className="relative group z-10 cursor-pointer"
                        aria-label="Play video"
                      >
                        <div className="transition-transform group-hover:scale-105">
                          <PlayButton />
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/CO3YwjRXyQo?autoplay=1"
                    title="Identity Service Setup Walkthrough"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="pt-4">
                <Typography variant="h5" textAlign="center">
                  Watch our video walkthrough for easy setup
                </Typography>
              </div>
              <div className="text-center mx-auto">
                <Typography textAlign="center" variant="body1" maxWidth="70%" sx={{margin: '0 auto'}}>
                  Secure your AI agents and MCP servers with trusted identities. Create, verify, and manage agent identities
                  for secure communication and authentication.{' '}
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
                </Typography>
              </div>
            </div>
            <div className="hidden md:block">
              <Divider orientation="vertical" sx={{margin: '0 auto', height: '600px'}} />
            </div>
            <div className="w-full md:max-w-[40%] space-y-4 px-8 md:px-4 py-8">
              <Typography variant="h6" textAlign="left" marginBottom={'16px'}>
                Setup Checklist
              </Typography>
              <div className="text-left md:pr-6">
                <Typography textAlign="left" variant="body2" marginBottom={'16px'}>
                  Begin setting up your Identity Service to start creating identities and TBAC policies.
                </Typography>
                <Typography textAlign="left" variant="body2">
                  Pre-requisite: Ensure you have agentic services (agents and/or an MCP server) capable of consuming and
                  using these identities within your application.{' '}
                </Typography>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex gap-2 items-start">
                  <Checkbox
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    checked={setIdp}
                    sx={{cursor: 'default'}}
                  />
                  <Link
                    href={PATHS.settings.identityProvider.connection}
                    fontStyle={{
                      fontSize: '14px',
                      color: '#3C4551'
                    }}
                    style={{
                      color: '#3C4551'
                    }}
                    onClick={() => {
                      analyticsTrack('CLICK_NAVIGATION_CONNECT_IDENTITY_PROVIDER');
                      setSetIdp(true);
                    }}
                  >
                    Configure Identity Provider
                  </Link>
                </div>
                <div className="flex gap-2 items-start">
                  <Checkbox
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    checked={addAgent}
                    sx={{cursor: 'default'}}
                  />
                  <Link
                    disabled={setIdp ? false : true}
                    href={PATHS.agenticServices.add}
                    fontStyle={{
                      fontSize: '14px',
                      color: '#3C4551'
                    }}
                    style={{
                      color: '#3C4551'
                    }}
                    onClick={() => {
                      analyticsTrack('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE');
                      setAddAgent(true);
                    }}
                  >
                    Add Agentic Service
                  </Link>
                </div>
                <div className="flex gap-2 items-start">
                  <Checkbox
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    checked={createBadge}
                    sx={{cursor: 'default'}}
                  />
                  <Link
                    disabled={!(setIdp && addAgent)}
                    href={PATHS.agenticServices.base}
                    fontStyle={{
                      fontSize: '14px',
                      color: '#3C4551'
                    }}
                    style={{
                      color: '#3C4551'
                    }}
                    onClick={() => {
                      analyticsTrack('CLICK_NAVIGATION_CREATE_BADGE');
                      setCreateBadge(true);
                    }}
                  >
                    Create Badge
                  </Link>
                </div>
                <div className="flex gap-2 items-start">
                  <Checkbox
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    checked={createPolicy}
                    sx={{cursor: 'default'}}
                  />
                  <div>
                    <Link
                      disabled={!(setIdp && addAgent && createBadge)}
                      href={PATHS.policies.create}
                      fontStyle={{
                        fontSize: '14px',
                        color: '#3C4551'
                      }}
                      style={{
                        color: '#3C4551'
                      }}
                      onClick={() => {
                        analyticsTrack('CLICK_NAVIGATION_ADD_POLICY');
                        setCreatePolicy(true);
                      }}
                    >
                      Create TBAC Policy
                    </Link>
                    <Typography variant="body2" fontSize={'12px'} marginTop={'4px'}>
                      Note: To add TBAC policies, you must have at least two agentic services registered.
                    </Typography>
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
