/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useGetSettings} from '@/queries';
import {IdpType} from '@/types/api/settings';
import {toast} from '@outshift/spark-design';
import {useEffect, useMemo} from 'react';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {Loading} from '@/components/ui/loading';

export const SettingsProvider = ({children}: {children: React.ReactNode}) => {
  const {data, isError, isLoading} = useGetSettings();

  const isEmptyIdp = useMemo(() => {
    return !data?.issuerSettings || data.issuerSettings.idpType === IdpType.IDP_TYPE_UNSPECIFIED;
  }, [data?.issuerSettings]);

  const {setIsEmptyIdp, setApiKey} = useSettingsStore(
    useShallow((state) => ({
      setIsEmptyIdp: state.setIsEmptyIdp,
      setApiKey: state.setApiKey
    }))
  );

  useEffect(() => {
    if (isError) {
      toast({
        title: 'Error fetching identity provider settings',
        description: 'There was an error fetching the identity provider settings. Please try again later.',
        type: 'error'
      });
    }
  }, [isError]);

  useEffect(() => {
    if (data?.apiKey?.apiKey) {
      setApiKey(data.apiKey.apiKey);
    }
  }, [data?.apiKey?.apiKey, setApiKey]);

  useEffect(() => {
    setIsEmptyIdp(isEmptyIdp);
  }, [isEmptyIdp, setIsEmptyIdp]);

  if (isLoading) {
    return <Loading />;
  }

  return children;
};
