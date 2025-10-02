/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { ScalarOptions } from '@scalar/docusaurus'

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'AGNTCY Identity Service',
  tagline: 'Create and manage identities for your MCP Servers, A2A Agents and OASF, with support for Task Based Access Control (TBAC).',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://identity-service.outshift.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Outshift', // Usually your GitHub org/user name.
  projectName: 'AGNTCY Identity Service', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          sidebarCollapsed: true,
        },
        theme: {
          customCss: ['./src/css/custom.css'],
        },
      }
    ],
    [
      'docusaurus-protobuffet',
      {
        protobuffet: {
          fileDescriptorsPath: './static/api/proto/v1alpha1/proto_workspace.json',
          protoDocsPath: './protodocs',
          sidebarPath: './generatedSidebarsProtodocs.js',
        },
        docs: {
          routeBasePath: 'protodocs',
          sidebarPath: './generatedSidebarsProtodocs.js',
        }
      }
    ]
  ],

  plugins: [
    [
      '@scalar/docusaurus',
      {
        label: 'OpenAPI',
        route: '/openapi/service/v1alpha1',
        showNavLink: true,
        configuration: {
          url: '/api/openapi/service/v1alpha1/openapi.yaml',
          hideDarkModeToggle: true,
          layout: 'modern',
          customCss: './src/css/custom.css'
        },
      } as ScalarOptions,
    ],
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      ({
        hashed: true,
      }),
    ],
    [
      require.resolve('./src/plugins/panzoom'),
      {
        timeout: 1500
      },
    ],
  ],

  themeConfig: {
    docs: {
      sidebar: {
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'AGNTCY Identity Service',
      logo: {
        alt: 'Identity Engine',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg'
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: 'protodocs/agntcy/identity/service/v1alpha1/app.proto',
          activeBasePath: 'protodocs',
          label: 'Protodocs',
          position: 'left',
        },
        {
          href: 'https://github.com/agntcy/identity-service',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          title: 'Community',
          items: [
            {
              label: 'AGNTCY',
              href: 'https://github.com/agntcy',
            },
            {
              label: 'AGNTCY Identity Service',
              href: 'https://github.com/agntcy/identity-service',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Outshift. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    }
  } satisfies Preset.ThemeConfig,

  markdown: {
    mermaid: true,
  },

  themes: [
    "@docusaurus/theme-mermaid",
    "docusaurus-json-schema-plugin"
  ],

  scripts: [
  {
    src: 'data:text/javascript;charset=utf-8,' + encodeURIComponent(`
      (function() {
        const mazeConfig = {
          'identity-docs.staging.outshift.ai': 'bb2165a9-97e9-4feb-9fee-27bf371146ad',
          'identity-docs.outshift.com': 'a9eb2582-a56a-4cbb-b869-3f03b8de7365'
        };

        const hostname = window.location.hostname;
        const mazeId = mazeConfig[hostname];

        if (mazeId) {
          (function (m, a, z, e) {
            window.mazeId = e;
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
          })(window, document, 'https://snippet.maze.co/maze-universal-loader.js', mazeId);
        }
      })();
    `),
    async: false,
  }
],
};

export default config;
