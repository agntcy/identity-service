/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
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

export const FeatureFlagsProvider: React.FC<React.PropsWithChildren<{ENABLE_FEATURE_FLAGS?: boolean}>> = ({
  children,
  ENABLE_FEATURE_FLAGS = false
}) => {
  const [controller, setController] = useState<boolean>(true);

  const {setFeatureFlags, clean} = useFeatureFlagsStore(
    useShallow((store) => ({
      setFeatureFlags: store.setFeatureFlags,
      clean: store.clean
    }))
  );

  const {authInfo} = useAuth();
  const {data, isLoading, isError} = useGetTenant(authInfo?.user?.tenant?.id || '');

  useEffect(() => {
    if (ENABLE_FEATURE_FLAGS) {
      if (!authInfo || !authInfo.isAuthenticated) {
        return setController(false);
      }
      if (data) {
        const entitlements = data.entitlements;
        if (entitlements && entitlements.length > 0) {
          clean();
          entitlements.forEach((entitlement, index, array) => {
            if (entitlement === EntitlementsSchema.Enum.TBAC) {
              setFeatureFlags({isTbacEnabled: true});
            }
            if (index === array.length - 1) {
              setController(false);
            }
          });
        } else {
          setController(false);
        }
      } else {
        if (!authInfo?.isAuthenticated || isError) {
          setController(false);
        }
      }
    } else {
      setController(false);
    }
  }, [ENABLE_FEATURE_FLAGS, authInfo, clean, data, isError, setFeatureFlags]);

  useEffect(() => {
    if (!ENABLE_FEATURE_FLAGS) {
      return;
    }
    const timer = setTimeout(() => {
      setController(false);
    }, TIME_OUT * 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [ENABLE_FEATURE_FLAGS]);

  if (!ENABLE_FEATURE_FLAGS) {
    return children;
  }

  if (isLoading || controller) {
    return <Loading />;
  }

  return children;
};
