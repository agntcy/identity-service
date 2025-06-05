/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {IdentityProvidersFormValues} from '@/schemas/identity-provider-schema';
import {PasswordManagmentProviders} from '@/types/providers';
import {create, StateCreator} from 'zustand';
import {createJSONStorage, persist, PersistOptions} from 'zustand/middleware';

type Store = {
  identityProvider?: IdentityProvidersFormValues;
  setIdentityProvider: (value: IdentityProvidersFormValues) => void;
  passwordManagementProvider?: PasswordManagmentProviders;
  setPasswordManagementProvider: (value: PasswordManagmentProviders) => void;
  cleanStore: () => void;
};

type PersistStore = (config: StateCreator<Store>, options: PersistOptions<Store>) => StateCreator<Store>;

export const useStore = create<Store>(
  (persist as PersistStore)(
    (set): Store => ({
      identityProvider: undefined,
      setIdentityProvider: (value: IdentityProvidersFormValues) => set(() => ({identityProvider: value})),
      passwordManagementProvider: undefined,
      setPasswordManagementProvider: (value: PasswordManagmentProviders) => set(() => ({passwordManagementProvider: value})),
      cleanStore: () => set(() => ({identityProvider: undefined, passwordManagementProvider: undefined}))
    }),
    {
      name: 'identity-ui-store',
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);
