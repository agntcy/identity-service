/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {GetSessionResponse} from '@/types/api/iam';
import {create} from 'zustand';

type SettingsStore = {
  isEmptyIdp: boolean;
  session?: GetSessionResponse;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  setSession: (session: GetSessionResponse) => void;
  setIsEmptyIdp: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>(
  (set): SettingsStore => ({
    isEmptyIdp: true,
    session: undefined,
    isAdmin: false,
    setIsAdmin: (value: boolean) => set(() => ({isAdmin: value})),
    setSession: (session: GetSessionResponse) => set(() => ({session})),
    setIsEmptyIdp: (value: boolean) => set(() => ({isEmptyIdp: value}))
  })
);
