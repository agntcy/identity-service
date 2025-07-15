/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Footer as SparkFooter} from '@outshift/spark-design';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {config} from './cookie-consent/config';
import {useEffect} from 'react';
import '@/styles/cookie.css';
import {useWindowSize} from '@/hooks';

export const Footer = () => {
  const {width} = useWindowSize();

  useEffect(() => {
    if (window) {
      void CookieConsentVanilla.run(config);
    } else {
      console.warn('CookieConsent is not available in this environment.');
    }
  }, []);

  return (
    <>
      <SparkFooter
        productName="Cisco Systems, Inc."
        productLink="https://www.cisco.com/"
        links={
          width >= 768
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
