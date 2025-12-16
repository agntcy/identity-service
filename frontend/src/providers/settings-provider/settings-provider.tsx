/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useGetAgenticServiceTotalCount, useGetPoliciesCount, useGetSession, useGetSettings} from '@/queries';
import {IdpType} from '@/types/api/settings';
import {toast} from '@open-ui-kit/core';
import {useEffect, useMemo} from 'react';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {Loading} from '@/components/ui/loading';
import {useAuth} from '@/hooks';
import {isMultiTenant} from '@/utils/auth';

const SettingsProvider = ({children}: {children: React.ReactNode}) => {
  const {authInfo} = useAuth();

  const {data: dataSettings, isError: isErrorSettings, isLoading: isLoadingSettings} = useGetSettings();
  const {
    data: dataAgenticServices,
    isLoading: isLoadingAgenticServices,
    isError: isErrorAgenticServices
  } = useGetAgenticServiceTotalCount();
  const {data: dataPolicies, isLoading: isLoadingPolicies, isError: isErrorPolicies} = useGetPoliciesCount({enabled: true});

  // Only use session hook in multi-tenant mode
  const multiTenantMode = isMultiTenant();
  const sessionQuery = useGetSession();
  const {
    data: dataSession,
    isError: isErrorSession,
    isLoading: isLoadingSession
  } = multiTenantMode ? sessionQuery : {data: null, isError: false, isLoading: false};

  const isAdmin = useMemo(() => {
    if (!multiTenantMode) {
      // In OIDC mode, mock admin status
      return true;
    }
    return dataSession?.groups?.[0]?.role === 'ADMIN' || false;
  }, [dataSession?.groups, multiTenantMode]);

  const isEmptyIdp = useMemo(() => {
    return !dataSettings?.issuerSettings || dataSettings.issuerSettings.idpType === IdpType.IDP_TYPE_UNSPECIFIED;
  }, [dataSettings?.issuerSettings]);

  const {setIsEmptyIdp, setSession, setIsAdmin, setIssuerSettings, setTotalAgenticServices, setTotalPolicies} =
    useSettingsStore(
      useShallow((state) => ({
        setIsEmptyIdp: state.setIsEmptyIdp,
        setSession: state.setSession,
        setIsAdmin: state.setIsAdmin,
        setIssuerSettings: state.setIssuerSettings,
        setTotalAgenticServices: state.setTotalAgenticServices,
        setTotalPolicies: state.setTotalPolicies
      }))
    );

  useEffect(() => {
    if (isErrorSettings) {
      toast({
        title: 'Error fetching identity provider settings',
        description: 'There was an error fetching the identity provider settings. Please try again later.',
        type: 'error'
      });
    }
  }, [isErrorSettings]);

  useEffect(() => {
    if (isErrorAgenticServices) {
      toast({
        title: 'Error fetching agentic services count',
        description: 'There was an error fetching the agentic services count. Please try again later.',
        type: 'error'
      });
    }
  }, [isErrorAgenticServices]);

  useEffect(() => {
    if (isErrorPolicies) {
      toast({
        title: 'Error fetching policies count',
        description: 'There was an error fetching the policies count. Please try again later.',
        type: 'error'
      });
    }
  }, [isErrorPolicies]);

  useEffect(() => {
    if (multiTenantMode && isErrorSession) {
      toast({
        title: 'Error fetching session',
        description: 'There was an error fetching the session. Please try again later.',
        type: 'error'
      });
    }
  }, [isErrorSession, multiTenantMode]);

  useEffect(() => {
    if (multiTenantMode && dataSession) {
      setSession(dataSession);
      setIsAdmin(isAdmin);
    } else if (!multiTenantMode) {
      // Mock session data for OIDC mode
      const mockSession = {
        username: authInfo?.user?.username || 'username',
        groups: [
          {
            group: {
              id: 'mock-group-id',
              name: 'mock-group-name'
            },
            role: 'ADMIN' as const,
            productRoles: []
          }
        ]
      };
      setSession(mockSession);
      setIsAdmin(isAdmin);
    }
  }, [dataSession, isAdmin, setSession, setIsAdmin, multiTenantMode, authInfo?.user?.username]);

  useEffect(() => {
    if (dataAgenticServices?.total) {
      setTotalAgenticServices(Number(dataAgenticServices.total));
    }
  }, [dataAgenticServices, setTotalAgenticServices]);

  useEffect(() => {
    if (dataPolicies?.total) {
      setTotalPolicies(Number(dataPolicies.total));
    }
  }, [dataPolicies, setTotalPolicies]);

  useEffect(() => {
    setIsEmptyIdp(isEmptyIdp);
  }, [isEmptyIdp, setIsEmptyIdp]);

  useEffect(() => {
    setIssuerSettings(dataSettings?.issuerSettings);
  }, [dataSettings?.issuerSettings, setIssuerSettings]);

  // Only show loading for session in multi-tenant mode
  const shouldShowLoading =
    isLoadingSettings || (multiTenantMode && isLoadingSession) || isLoadingAgenticServices || isLoadingPolicies;

  if (shouldShowLoading) {
    return <Loading />;
  }

  return children;
};

export default SettingsProvider;
