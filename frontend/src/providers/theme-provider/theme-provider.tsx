/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {useThemeStore} from '@/store';
import {ThemeProvider as SparkThemeProvider} from '@open-ui-kit/core';
import {useShallow} from 'zustand/react/shallow';

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const {isDarkMode} = useThemeStore(
    useShallow((store) => ({
      isDarkMode: store.isDarkMode
    }))
  );
  return <SparkThemeProvider isDarkMode={isDarkMode}>{children}</SparkThemeProvider>;
};
