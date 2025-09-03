/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useGetSession, useGetSettings} from '@/queries';
import {IdpType} from '@/types/api/settings';
import {toast} from '@outshift/spark-design';
import {useEffect, useMemo} from 'react';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {Loading} from '@/components/ui/loading';

const SettingsProvider = ({children}: {children: React.ReactNode}) => {
  const {data: dataSettings, isError: isErrorSettings, isLoading: isLoadingSettings} = useGetSettings();
  const {data: dataSession, isError: isErrorSession, isLoading: isLoadingSession} = useGetSession();

  const isAdmin = useMemo(() => {
    return dataSession?.groups?.[0]?.role === 'ADMIN' || false;
  }, [dataSession?.groups]);

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
    if (isErrorSession) {
      toast({
        title: 'Error fetching session',
        description: 'There was an error fetching the session. Please try again later.',
        type: 'error'
      });
    }
  }, [isErrorSession]);

  useEffect(() => {
    if (dataSession) {
      setSession(dataSession);
      setIsAdmin(isAdmin);
    }
  }, [dataSession, isAdmin, setSession, setIsAdmin]);

  useEffect(() => {
    setIsEmptyIdp(isEmptyIdp);
  }, [isEmptyIdp, setIsEmptyIdp]);

  if (isLoadingSettings || isLoadingSession) {
    return <Loading />;
  }

  return children;
};

export default SettingsProvider;
