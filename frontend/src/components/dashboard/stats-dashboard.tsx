/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Typography} from '@outshift/spark-design';
import {CheckIcon, PlusIcon} from 'lucide-react';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {PATHS} from '@/router/paths';
import {Link, Link as RouterLink} from 'react-router-dom';
import {useFeatureFlagsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {useGetAgenticServiceTotalCount, useGetPolicies, useGetSettings} from '@/queries';
import StatsCard, {Stat} from '../ui/stats-card';
import {ProviderType} from '../shared/identity-provider/provider-type';
import {useMemo} from 'react';
import {cn} from '@/lib/utils';
import {WelcomeName} from './welcome-name';
import {useAnalytics} from '@/hooks';

export const StatsDashboard = () => {
  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );

  const {analyticsTrack} = useAnalytics();

  const {data: dataSettings, isLoading: isLoadingSettings} = useGetSettings();
  const {data: dataAgenticServices, isLoading: isLoadingAgenticServices} = useGetAgenticServiceTotalCount();
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
        value: <Link to={PATHS.agenticServices.base}>{dataAgenticServices?.total || 0}</Link>,
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
    dataAgenticServices?.total,
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
        <WelcomeName />
        <div className="px-[24px]">
          <StatsCard
            className={cn(
              'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 p-4',
              !isTbacEnable && 'md:grid-cols-2 lg:grid-cols-2'
            )}
            stats={statsInfo}
          />
        </div>
        <div className="card-group px-[24px]">
          <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-start items-center px-20 py-12 hidden md:block">
            <div className="flex flex-col justify-between h-full gap-4">
              <div>
                <Typography variant="h6" textAlign="center">
                  Verify Identity Badges
                </Typography>
                <Typography variant="body1" marginTop={1} textAlign="center">
                  Ensure secure communication and authentication by verifying identities
                </Typography>
              </div>
              <div className="flex justify-center items-center">
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
          <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-start items-center px-20 py-12 hidden md:block">
            <div className="flex flex-col justify-between h-full gap-4">
              <div>
                <Typography variant="h6" textAlign="center">
                  Add Agentic Services
                </Typography>
                <Typography variant="body1" marginTop={1} textAlign="center">
                  Add Agentic Services and generate Identity badges
                </Typography>
              </div>
              <div className="flex justify-center items-center">
                <RouterLink
                  to={PATHS.agenticServices.add}
                  onClick={() => analyticsTrack('CLICK_NAVIGATION_ADD_AGENTIC_SERVICE')}
                >
                  <Button
                    variant="outlined"
                    sx={{fontWeight: '600 !important'}}
                    startIcon={<PlusIcon className="w-4 h-4" />}
                  >
                    Add Agentic Service
                  </Button>
                </RouterLink>
              </div>
            </div>
          </div>
          {isTbacEnable && (
            <div className="card-flex-group min-w-[384px] bg-[#FBFCFE] rounded-[8px] flex-col flex justify-start items-center px-20 py-12 hidden md:block">
              <div className="flex flex-col justify-between h-full gap-4">
                <div>
                  <Typography variant="h6" textAlign="center">
                    Add Policies
                  </Typography>
                  <Typography variant="body1" marginTop={1} textAlign="center">
                    Manage access and permissions for secure agentic interactions
                  </Typography>
                </div>
                <div className="flex justify-center items-center mt-8">
                  <RouterLink to={PATHS.policies.create} onClick={() => analyticsTrack('CLICK_NAVIGATION_ADD_POLICY')}>
                    <Button
                      variant="outlined"
                      sx={{fontWeight: '600 !important'}}
                      startIcon={<PlusIcon className="w-4 h-4" />}
                    >
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
