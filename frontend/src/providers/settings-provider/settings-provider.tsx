/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useGetSession, useGetSettings} from '@/queries';
import {IdpType} from '@/types/api/settings';
import {toast} from '@open-ui-kit/core';
import {useEffect, useMemo} from 'react';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {Loading} from '@/components/ui/loading';
import {isMultiTenant} from '@/utils/get-auth-config';
import {useAuth} from '@/hooks';

const SettingsProvider = ({children}: {children: React.ReactNode}) => {
  const {authInfo} = useAuth();

  const {data: dataSettings, isError: isErrorSettings, isLoading: isLoadingSettings} = useGetSettings();

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

  const {setIsEmptyIdp, setSession, setIsAdmin} = useSettingsStore(
    useShallow((state) => ({
      setIsEmptyIdp: state.setIsEmptyIdp,
      setSession: state.setSession,
      setIsAdmin: state.setIsAdmin
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
    setIsEmptyIdp(isEmptyIdp);
  }, [isEmptyIdp, setIsEmptyIdp]);

  // Only show loading for session in multi-tenant mode
  const shouldShowLoading = isLoadingSettings || (multiTenantMode && isLoadingSession);

  if (shouldShowLoading) {
    return <Loading />;
  }

  return children;
};

export default SettingsProvider;
