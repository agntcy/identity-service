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
  totalAgenticServices: number;
  totalPolicies: number;
  setIsAdmin: (value: boolean) => void;
  setSession: (session: GetSessionResponse) => void;
  setIsEmptyIdp: (value: boolean) => void;
  setIssuerSettings: (issuerSettings?: IssuerSettings) => void;
  setTotalAgenticServices: (total: number) => void;
  setTotalPolicies: (total: number) => void;
};

export const useSettingsStore = create<SettingsStore>(
  (set): SettingsStore => ({
    isEmptyIdp: true,
    issuerSettings: undefined,
    session: undefined,
    isAdmin: false,
    totalAgenticServices: 0,
    totalPolicies: 0,
    setTotalAgenticServices: (total: number) => set(() => ({totalAgenticServices: total})),
    setTotalPolicies: (total: number) => set(() => ({totalPolicies: total})),
    setIssuerSettings: (issuerSettings?: IssuerSettings) => set(() => ({issuerSettings})),
    setIsAdmin: (value: boolean) => set(() => ({isAdmin: value})),
    setSession: (session: GetSessionResponse) => set(() => ({session})),
    setIsEmptyIdp: (value: boolean) => set(() => ({isEmptyIdp: value}))
  })
);
