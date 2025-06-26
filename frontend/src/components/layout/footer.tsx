/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PATHS} from '@/router/paths';
import {Footer as SparkFooter} from '@outshift/spark-design';

export const Footer = () => {
  return (
    <>
      <SparkFooter
        productName="Agntcy Inc."
        links={[
          {
            children: 'support@agntcy.com',
            href: 'mailto:support@agntcy.com',
            openInNewTab: true
          },
          {
            children: 'Terms & Conditions',
            href: PATHS.termsAndConditions
          },
          {
            children: 'Privacy Policy',
            href: 'https://www.cisco.com/c/en/us/about/legal/privacy-full.html',
            openInNewTab: true
          },
          {
            children: 'Cookies',
            href: '#'
          }
        ]}
      />
    </>
  );
};
