/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Footer as SparkFooter} from '@outshift/spark-design';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {useWindowSize} from '@/hooks';

export const Footer = () => {
  const {isMobile} = useWindowSize();
  return (
    <>
      <SparkFooter
        productName="Cisco Systems, Inc."
        productLink="https://www.cisco.com/"
        links={
          !isMobile
            ? [
                {
                  children: 'support@agntcy.com',
                  href: 'mailto:support@agntcy.com',
                  openInNewTab: true
                },
                {
                  children: 'Terms & Conditions',
                  href: 'https://www.cisco.com/c/en/us/about/legal/terms-conditions.html',
                  openInNewTab: true
                },
                {
                  children: 'Privacy Policy',
                  href: 'https://www.cisco.com/c/en/us/about/legal/privacy-full.html',
                  openInNewTab: true
                },
                {
                  children: 'Cookies',
                  href: '#',
                  onClick: () => CookieConsentVanilla.showPreferences()
                }
              ]
            : [
                {
                  children: 'Cookies',
                  href: '#',
                  onClick: () => CookieConsentVanilla.showPreferences()
                }
              ]
        }
      />
    </>
  );
};
