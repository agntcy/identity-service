/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Checkbox, Link, Typography} from '@open-ui-kit/core';
import {PATHS} from '@/router/paths';
import {docs} from '@/utils/docs';
import {WelcomeName} from './welcome-name';
import {RadioButtonUnchecked, CheckCircle} from '@mui/icons-material';
import {useState} from 'react';
import {PlayButton} from './play-button';
import VideoThumbNail from '@/assets/dashboard/video-thumbnail.png';
import {useAnalytics} from '@/hooks';
import {useLocalStore, useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import CheckIcon from '@/assets/dashboard/check.svg?react';
import {globalConfig} from '@/config/global';

export const ContentDashboard = () => {
  const [showVideo, setShowVideo] = useState(false);

  const {analyticsTrack} = useAnalytics();

  const {isEmptyIdp, totalAgenticServices, totalPolicies} = useSettingsStore(
    useShallow((state) => ({
      isEmptyIdp: state.isEmptyIdp,
      totalAgenticServices: state.totalAgenticServices,
      totalPolicies: state.totalPolicies
    }))
  );

  const {addAgent, createBadge, createPolicy} = useLocalStore(
    useShallow((state) => ({
      addAgent: state.addAgent,
      createBadge: state.createBadge,
      createPolicy: state.createPolicy
    }))
  );

  const allSet = !isEmptyIdp && totalAgenticServices > 0 && totalPolicies > 0 && addAgent && createBadge && createPolicy;

  return (
    <div className="flex flex-col h-full gap-[16px]">
      <WelcomeName />
      <div className="dashboard-card mx-6 mb-4">
        <div className="dashboard-card-content flex flex-row items-start justify-center h-full pt-4 gap-4">
          <div className="hidden md:flex py-8 pb-12 space-y-4 max-w-[60%] flex-col items-center border-bar mb-4">
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
          {!allSet ? (
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
                <div className="flex gap-2 items-center">
                  <Checkbox
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    checked={!isEmptyIdp}
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
                    }}
                    disabled={!isEmptyIdp}
                  >
                    Configure Identity Provider
                  </Link>
                </div>
                <div className="flex gap-2 items-center">
                  <Checkbox
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    checked={!isEmptyIdp && totalAgenticServices > 0 && addAgent}
                    sx={{cursor: 'default'}}
                  />
                  <Link
                    disabled={!isEmptyIdp && totalAgenticServices > 0 && addAgent}
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
                    }}
                  >
                    Add Agentic Service
                  </Link>
                </div>
                <div className="flex gap-2 items-center">
                  <Checkbox
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle />}
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    checked={!isEmptyIdp && addAgent && totalAgenticServices > 0 && createBadge}
                    sx={{cursor: 'default'}}
                  />
                  <Link
                    disabled={!isEmptyIdp && addAgent && totalAgenticServices > 0 && createBadge}
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
                    checked={
                      !isEmptyIdp && addAgent && totalAgenticServices > 0 && createBadge && createPolicy && totalPolicies > 0
                    }
                    sx={{cursor: 'default'}}
                  />
                  <div>
                    <Link
                      disabled={
                        !isEmptyIdp &&
                        addAgent &&
                        totalAgenticServices > 0 &&
                        createBadge &&
                        createPolicy &&
                        totalPolicies > 0
                      }
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
          ) : (
            <div className="flex flex-row w-full md:max-w-[40%] mx-auto space-y-4 px-8 md:px-4 py-8 items-center justify-center my-auto">
              <div className="flex justity-center flex-col">
                <div className="mx-auto mb-4">
                  <CheckIcon />
                </div>
                <Typography variant="h5" textAlign="center" marginBottom={'16px'}>
                  Congratulations!
                </Typography>
                <Typography textAlign="center" variant="body1" maxWidth="90%" sx={{margin: '0 auto'}}>
                  Your Identity Service is set up and ready to use! Keep exploring Identity Service by{' '}
                  <Link
                    href={PATHS.agenticServices.add}
                    fontStyle={{
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '24px',
                      letterSpacing: '0.01em'
                    }}
                    onClick={() => analyticsTrack('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE')}
                  >
                    adding new agentic
                  </Link>{' '}
                  services to generate badges and{' '}
                  <Link
                    href={PATHS.policies.create}
                    fontStyle={{
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '24px',
                      letterSpacing: '0.01em'
                    }}
                    onClick={() => analyticsTrack('CLICK_NAVIGATION_ADD_POLICY')}
                  >
                    create policies
                  </Link>
                  ,{' '}
                  <Link
                    href={PATHS.verifyIdentity.base}
                    fontStyle={{
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '24px',
                      letterSpacing: '0.01em'
                    }}
                    onClick={() => analyticsTrack('CLICK_NAVIGATION_VERIFY_IDENTITIES')}
                  >
                    verify identities
                  </Link>
                  , or visit our{' '}
                  <Link
                    href={globalConfig.company.gitHub}
                    openInNewTab
                    fontStyle={{
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '24px',
                      letterSpacing: '0.01em'
                    }}
                  >
                    GitHub
                  </Link>{' '}
                  or{' '}
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
                    documentation
                  </Link>{' '}
                  for more resources.
                </Typography>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
