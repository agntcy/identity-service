/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiKey} from '@/types/api/settings';
import {create} from 'zustand';

type SettingsStore = {
  isEmptyIdp: boolean;
  apiKey?: string;
  setIsEmptyIdp: (value: boolean) => void;
  setApiKey: (apiKey: string) => void;
};

export const useSettingsStore = create<SettingsStore>(
  (set): SettingsStore => ({
    isEmptyIdp: false,
    apiKey: undefined,
    setApiKey: (apiKey: string) => set(() => ({apiKey: apiKey})),
    setIsEmptyIdp: (value: boolean) => set(() => ({isEmptyIdp: value}))
  })
);
