/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {create} from 'zustand';

type ThemeStore = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
};

export const useThemeStore = create<ThemeStore>(
  (set): ThemeStore => ({
    isDarkMode: false,
    toggleDarkMode: () => set((state) => ({isDarkMode: !state.isDarkMode})),
    setDarkMode: (value: boolean) => set(() => ({isDarkMode: value}))
  })
);
