/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {GetSessionResponse} from '@/types/api/iam';
import {IssuerSettings} from '@/types/api/settings';
import {create} from 'zustand';

type SettingsStore = {
  isEmptyIdp: boolean;
  issuerSettings?: IssuerSettings;
  session?: GetSessionResponse;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  setSession: (session: GetSessionResponse) => void;
  setIsEmptyIdp: (value: boolean) => void;
  setIssuerSettings: (issuerSettings?: IssuerSettings) => void;
};

export const useSettingsStore = create<SettingsStore>(
  (set): SettingsStore => ({
    isEmptyIdp: true,
    issuerSettings: undefined,
    session: undefined,
    isAdmin: false,
    setIssuerSettings: (issuerSettings?: IssuerSettings) => set(() => ({issuerSettings})),
    setIsAdmin: (value: boolean) => set(() => ({isAdmin: value})),
    setSession: (session: GetSessionResponse) => set(() => ({session})),
    setIsEmptyIdp: (value: boolean) => set(() => ({isEmptyIdp: value}))
  })
);
