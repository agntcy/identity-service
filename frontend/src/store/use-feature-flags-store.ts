/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {FeatureFlags} from '@/schemas/entitlements-schema';
import {create} from 'zustand';

type FeatureFlagsStore = {
  isReady: boolean;
  setIsReady: (isReady: boolean) => void;
  featureFlags: FeatureFlags;
  setFeatureFlags: (featureFlags: Partial<FeatureFlags>) => void;
  clean: () => void;
};

const initialState: FeatureFlags = {
  isTbacEnable: false
};

export const useFeatureFlagsStore = create<FeatureFlagsStore>(
  (set): FeatureFlagsStore => ({
    isReady: false,
    setIsReady: (isReady: boolean) => set(() => ({isReady})),
    featureFlags: initialState,
    setFeatureFlags: (featureFlags) => set((store) => ({featureFlags: {...store.featureFlags, ...featureFlags}})),
    clean: () => set(() => ({featureFlags: initialState}))
  })
);
