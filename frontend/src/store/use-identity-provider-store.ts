/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {create} from 'zustand';

type IdentityProviderStore = {
  isEmptyIdp: boolean;
  setIsEmptyIdp: (value: boolean) => void;
};

export const useIdentityProviderStore = create<IdentityProviderStore>(
  (set): IdentityProviderStore => ({
    isEmptyIdp: false,
    setIsEmptyIdp: (value: boolean) => set(() => ({isEmptyIdp: value}))
  })
);
