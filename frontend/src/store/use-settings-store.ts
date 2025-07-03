/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {create} from 'zustand';

type SettingsStore = {
  isEmptyIdp: boolean;
  setIsEmptyIdp: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>(
  (set): SettingsStore => ({
    isEmptyIdp: false,
    setIsEmptyIdp: (value: boolean) => set(() => ({isEmptyIdp: value}))
  })
);
