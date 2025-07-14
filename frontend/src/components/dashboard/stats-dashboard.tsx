/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Typography} from '@outshift/spark-design';
import {CheckIcon, PlusIcon} from 'lucide-react';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {PATHS} from '@/router/paths';
import {useAuth} from '@/hooks';
import {Link, Link as RouterLink} from 'react-router-dom';
import {useFeatureFlagsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {useGetAgenticServices, useGetPolicies, useGetSettings} from '@/queries';
import StatsCard, {Stat} from '../ui/stats-card';
import {ProviderType} from '../shared/provider-type';
import {useMemo} from 'react';
import {cn} from '@/lib/utils';

export const StatsDashboard = () => {
  const {authInfo} = useAuth();

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );
  const {data: dataSettings, isLoading: isLoadingSettings} = useGetSettings();
  const {data: dataAgenticServices, isLoading: isLoadingAgenticServices} = useGetAgenticServices();
  const {data: dataPolicies, isLoading: isLoadingPolicies} = useGetPolicies({enable: isTbacEnable});

  const statsInfo: Stat[] = useMemo(() => {
    const temp = [
      {
        value: (
          <Link to={PATHS.settings.identityProvider.base}>
            <ProviderType type={dataSettings?.issuerSettings?.idpType} />
          </Link>
        ),
        title: 'Identity Provider',
        loading: isLoadingSettings
      },
      {
        value: <Link to={PATHS.agenticServices.base}>{dataAgenticServices?.apps?.length || 0}</Link>,
        title: 'Total Agentic Services',
        loading: isLoadingAgenticServices
      }
    ];
    if (isTbacEnable) {
      temp.push({
        value: <Link to={PATHS.policies.base}>{dataPolicies?.policies?.length || 0}</Link>,
        title: 'Total Policies',
        loading: isLoadingPolicies
      });
    }
    return temp;
  }, [
    dataAgenticServices?.apps?.length,
    dataPolicies?.policies?.length,
    dataSettings?.issuerSettings?.idpType,
    isLoadingAgenticServices,
    isLoadingPolicies,
    isLoadingSettings,
    isTbacEnable
  ]);

  return (
    <ScrollShadowWrapper>
      <div className="flex flex-col h-full gap-[16px]">
        <div className="w-full h-[184px] bg-[#00142B] flex flex-col justify-between sticky top-0 z-10">
          <div className="flex justify-center items-center my-auto">
            <div>
              <Typography variant="h3" textAlign="center" sx={(theme) => ({color: theme.palette.vars.brandIconTertiaryDefault})}>
                Welcome to Agent Identity, <span className="capitalize">{authInfo?.user?.name || 'User'}!</span>
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
            className={cn('grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 p-4', !isTbacEnable && 'md:grid-cols-2 lg:grid-cols-2')}
            stats={statsInfo}
          />
        </div>
        <div className="card-group px-[24px]">
          <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-start items-center px-20 py-12">
            <div className="flex flex-col justify-between h-full">
              <div>
                <Typography variant="h6" textAlign="center">
                  Verify Identity Badges
                </Typography>
                <Typography variant="body1" marginTop={1} textAlign="center">
                  Ensure secure communication and authentication by verifying identities
                </Typography>
              </div>
              <div className="flex justify-center items-center">
                <RouterLink to={PATHS.agenticServices.verifyIdentity}>
                  <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<CheckIcon className="w-4 h-4" />}>
                    Verify Identity
                  </Button>
                </RouterLink>
              </div>
            </div>
          </div>
          <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-start items-center px-20 py-12">
            <div className="flex flex-col justify-between h-full">
              <div>
                <Typography variant="h6" textAlign="center">
                  Add Agentic Services
                </Typography>
                <Typography variant="body1" marginTop={1} textAlign="center">
                  Add Agentic Services and generate Identity badges
                </Typography>
              </div>
              <div className="flex justify-center items-center">
                <RouterLink to={PATHS.agenticServices.add}>
                  <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<PlusIcon className="w-4 h-4" />}>
                    Add Agentic Service
                  </Button>
                </RouterLink>
              </div>
            </div>
          </div>
          {isTbacEnable && (
            <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-start items-center px-20 py-12">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <Typography variant="h6" textAlign="center">
                    Add Policies
                  </Typography>
                  <Typography variant="body1" marginTop={1} textAlign="center">
                    Manage access and permissions for secure agentic interactions
                  </Typography>
                </div>
                <div className="flex justify-center items-center mt-8">
                  <RouterLink to={PATHS.policies.create}>
                    <Button variant="outlined" sx={{fontWeight: '600 !important'}} startIcon={<PlusIcon className="w-4 h-4" />}>
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
