/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {create, StateCreator} from 'zustand';
import {createJSONStorage, persist, PersistOptions} from 'zustand/middleware';

type LocalStore = {
  idDevice?: string;
  onBoarded: boolean;
  setIdDevice: (idDevice: string) => void;
  setOnBoarded: (onBoarded: boolean) => void;
  cleanThemeStore: () => void;
};

type PersistStore = (config: StateCreator<LocalStore>, options: PersistOptions<LocalStore>) => StateCreator<LocalStore>;

export const useLocalStore = create<LocalStore>(
  (persist as PersistStore)(
    (set): LocalStore => ({
      idDevice: undefined,
      onBoarded: false,
      setIdDevice: (idDevice: string) => set(() => ({idDevice})),
      setOnBoarded: (onBoarded: boolean) => set(() => ({onBoarded})),
      cleanThemeStore: () => set(() => ({onBoarded: false, idDevice: undefined}))
    }),
    {
      name: 'identity-local-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
