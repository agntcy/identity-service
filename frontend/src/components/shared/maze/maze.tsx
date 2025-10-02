/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import config from '@/config';
import {Helmet} from 'react-helmet-async';

export const Maze = () => {
  if (!config.MAZE_ID) {
    return null;
  }

  return (
    <Helmet>
      <script nonce="211adc2e-df7d-4cd2-9694-bf0993603f8f">
        {`
           (function (m, a, z, e) {
             var s, t;
             try {
               t = m.sessionStorage.getItem('maze-us');
             } catch (err) {}

             if (!t) {
               t = new Date().getTime();
               try {
                 m.sessionStorage.setItem('maze-us', t);
               } catch (err) {}
             }

             s = a.createElement('script');
             s.src = z + '?apiKey=' + e;
             s.async = true;
             a.getElementsByTagName('head')[0].appendChild(s);
             m.mazeUniversalSnippetApiKey = e;
           })(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '${config.MAZE_ID}');
         `}
      </script>
    </Helmet>
  );
};
