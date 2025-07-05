/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Typography} from '@outshift/spark-design';
import {CheckIcon} from 'lucide-react';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {PATHS} from '@/router/paths';
import {useAuth} from '@/hooks';
import {Link as RouterLink} from 'react-router-dom';
import {useFeatureFlagsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {useGetAgenticServices, useGetPolicies, useGetSettings} from '@/queries';
import StatsCard from '../ui/stats-card';
import {ProviderType} from '../shared/provider-type';

export const StatsDashboard = () => {
  const {authInfo} = useAuth();

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );
  const {data: dataSettings, isLoading: isLoadingSettings} = useGetSettings();
  const {data: dataAgenticServices, isLoading: isLoadingAgenticServices} = useGetAgenticServices();
  const {data: dataPolicies, isLoading: isLoadingPolicies} = useGetPolicies();

  return (
    <ScrollShadowWrapper>
      <div className="flex flex-col h-full gap-[24px]">
        <div className="w-full h-[184px] bg-[#00142B] flex flex-col justify-between sticky top-0 z-10">
          <div className="flex justify-center items-center my-auto">
            <div>
              <Typography variant="h3" textAlign="center" sx={(theme) => ({color: theme.palette.vars.brandIconTertiaryDefault})}>
                Welcome to Agent Identity, {authInfo?.user?.name || 'User'}!
              </Typography>
              <Typography variant="body1" textAlign="center" sx={(theme) => ({color: theme.palette.vars.baseTextInverse})}>
                Create and manage identities for your MCP Servers, A2A Agents and OASF
              </Typography>
            </div>
          </div>
          <div className="striped-bar" />
        </div>
        <div className="px-[24px]">
          <StatsCard
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 p-4"
            stats={[
              {
                value: <ProviderType type={dataSettings?.issuerSettings?.idpType} />,
                title: 'Identity Provider',
                loading: isLoadingSettings
              },
              {
                value: dataAgenticServices?.apps?.length || 0,
                title: 'Total Agentic Services',
                loading: isLoadingAgenticServices
              },
              {
                value: dataPolicies?.policies?.length || 0,
                title: 'Total Policies',
                loading: isLoadingPolicies
              }
            ]}
          />
        </div>
        <div className="flex card-group px-[24px]">
          <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-center items-center px-20 pt-[40px] pb-[24px]">
            <div>
              <Typography variant="h6" textAlign="center">
                Verify Identity Badges
              </Typography>
              <Typography variant="body1" marginTop={2} textAlign="center">
                Ensure secure communication and authentication by verifying identities
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
          <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-center items-center px-20 pt-[40px] pb-[24px]">
            <div>
              <Typography variant="h6" textAlign="center">
                Create Badges
              </Typography>
              <Typography variant="body1" marginTop={2} textAlign="center">
                Generate Identity badges for your AI agents, MCP servers and A2A protocols
              </Typography>
              <div className="flex justify-center items-center mt-8">
                <RouterLink to={PATHS.agenticServices.base}>
                  <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<CheckIcon className="w-4 h-4" />}>
                    Create Badge
                  </Button>
                </RouterLink>
              </div>
            </div>
          </div>
          {isTbacEnable && (
            <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-center items-center px-20  pt-[40px] pb-[24px]">
              <div>
                <Typography variant="h6" textAlign="center">
                  Add Policies
                </Typography>
                <Typography variant="body1" marginTop={2} textAlign="center">
                  Manage access and permissions for secure agentic interactions
                </Typography>
                <div className="flex justify-center items-center mt-8">
                  <RouterLink to={PATHS.policies.create}>
                    <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<CheckIcon className="w-4 h-4" />}>
                      Add Policy
                    </Button>
                  </RouterLink>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollShadowWrapper>
  );
};
