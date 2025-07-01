/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect, useState} from 'react';
import {Loading} from '@/components/ui/loading';
import {useAuth} from '@/hooks';
import {EntitlementsSchema} from '@/schemas/entitlements-schema';
import {useGetTenant} from '@/queries';
import {useShallow} from 'zustand/react/shallow';
import {useFeatureFlagsStore} from '@/store';

const TIME_OUT = 10; //seconds

export const FeatureFlagsProvider = ({children}: React.PropsWithChildren) => {
  const [controller, setController] = useState<boolean>(true);

  const {setFeatureFlags, setIsReady, clean} = useFeatureFlagsStore(
    useShallow((store) => ({
      setFeatureFlags: store.setFeatureFlags,
      setIsReady: store.setIsReady,
      clean: store.clean
    }))
  );

  const {authInfo} = useAuth();
  const {data, isLoading, isError} = useGetTenant(authInfo?.user?.tenant?.id || '');

  useEffect(() => {
    if (!authInfo || !authInfo.isAuthenticated) {
      setIsReady(true);
      return setController(false);
    }
    if (data) {
      const entitlements = data.entitlements;
      if (entitlements && entitlements.length > 0) {
        clean();
        entitlements.forEach((entitlement, index, array) => {
          if (entitlement === EntitlementsSchema.Enum.TBAC) {
            setFeatureFlags({isTbacEnable: true});
          }
          if (index === array.length - 1) {
            setIsReady(true);
            setController(false);
          }
        });
      } else {
        setIsReady(true);
        setController(false);
      }
    } else {
      if (!authInfo?.isAuthenticated || isError) {
        setIsReady(true);
        setController(false);
      }
    }
  }, [authInfo, clean, data, isError, setFeatureFlags, setIsReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setController(false);
    }, TIME_OUT * 1000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (isLoading || controller) {
    return <Loading />;
  }

  return children;
};
