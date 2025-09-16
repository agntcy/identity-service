/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {FeatureFlags} from '@/schemas/entitlements-schema';
import {create} from 'zustand';

type FeatureFlagsStore = {
  featureFlags: FeatureFlags;
  setFeatureFlags: (featureFlags: Partial<FeatureFlags>) => void;
  clean: () => void;
};

const initialState: FeatureFlags = {
  isTbacEnabled: true
};

export const useFeatureFlagsStore = create<FeatureFlagsStore>(
  (set): FeatureFlagsStore => ({
    featureFlags: initialState,
    setFeatureFlags: (featureFlags) => set((store) => ({featureFlags: {...store.featureFlags, ...featureFlags}})),
    clean: () => set(() => ({featureFlags: initialState}))
  })
);
