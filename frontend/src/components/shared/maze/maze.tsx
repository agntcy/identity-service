/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import config from '@/config';
import {Helmet} from 'react-helmet-async';

declare global {
  interface Window {
    __MAZE_API_KEY__: string;
  }
}

export const Maze = () => {
  if (!config.MAZE_ID) {
    return null;
  }

  window.__MAZE_API_KEY__ = config.MAZE_ID;

  return (
    <Helmet>
      <script src={`${import.meta.env.BASE_URL}maze-loader.js`} async></script>
    </Helmet>
  );
};
