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
  const {data: dataSettings, isError: isErrorSettings, isLoading: isLoadingSettings} = useGetSettings();

  const isEmptyIdp = useMemo(() => {
    return !dataSettings?.issuerSettings || dataSettings.issuerSettings.idpType === IdpType.IDP_TYPE_UNSPECIFIED;
  }, [dataSettings?.issuerSettings]);

  const {setIsEmptyIdp} = useSettingsStore(
    useShallow((state) => ({
      setIsEmptyIdp: state.setIsEmptyIdp
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
    setIsEmptyIdp(isEmptyIdp);
  }, [isEmptyIdp, setIsEmptyIdp]);

  if (isLoadingSettings) {
    return <Loading />;
  }

  return children;
};
