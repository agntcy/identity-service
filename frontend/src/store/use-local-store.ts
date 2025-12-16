/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {create, StateCreator} from 'zustand';
import {createJSONStorage, persist, PersistOptions} from 'zustand/middleware';

type LocalStore = {
  idDevice?: string;
  setIdDevice: (idDevice: string | undefined) => void;
  onBoarded: boolean;
  setOnBoarded: (onBoarded: boolean) => void;
  addAgent: boolean;
  setAddAgent: (addAgent: boolean) => void;
  createBadge: boolean;
  setCreateBadge: (createBadge: boolean) => void;
  createPolicy: boolean;
  setCreatePolicy: (createPolicy: boolean) => void;
  cleanStore: () => void;
};

type PersistStore = (config: StateCreator<LocalStore>, options: PersistOptions<LocalStore>) => StateCreator<LocalStore>;

export const useLocalStore = create<LocalStore>(
  (persist as PersistStore)(
    (set): LocalStore => ({
      onBoarded: false,
      setOnBoarded: (onBoarded: boolean) => set(() => ({onBoarded})),
      cleanStore: () =>
        set(() => ({
          onBoarded: false,
          idDevice: undefined,
          setIdp: false,
          addAgent: false,
          createBadge: false,
          createPolicy: false
        })),
      idDevice: undefined,
      addAgent: false,
      setAddAgent: (addAgent: boolean) => set(() => ({addAgent})),
      createBadge: false,
      setCreateBadge: (createBadge: boolean) => set(() => ({createBadge})),
      createPolicy: false,
      setCreatePolicy: (createPolicy: boolean) => set(() => ({createPolicy})),
      setIdDevice: (idDevice: string | undefined) => set(() => ({idDevice}))
    }),
    {
      name: 'identity-local-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
