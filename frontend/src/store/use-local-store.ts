/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {create, StateCreator} from 'zustand';
import {createJSONStorage, persist, PersistOptions} from 'zustand/middleware';

type LocalStore = {
  idDevice?: string;
  setIdDevice: (idDevice: string | undefined) => void;
  onBoarded: boolean;
  setOnBoarded: (onBoarded: boolean) => void;
  cleanThemeStore: () => void;
};

type PersistStore = (config: StateCreator<LocalStore>, options: PersistOptions<LocalStore>) => StateCreator<LocalStore>;

export const useLocalStore = create<LocalStore>(
  (persist as PersistStore)(
    (set): LocalStore => ({
      onBoarded: false,
      setOnBoarded: (onBoarded: boolean) => set(() => ({onBoarded})),
      cleanThemeStore: () => set(() => ({onBoarded: false, idDevice: undefined})),
      idDevice: undefined,
      setIdDevice: (idDevice: string | undefined) => set(() => ({idDevice}))
    }),
    {
      name: 'identity-local-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
