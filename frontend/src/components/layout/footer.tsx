/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Footer as SparkFooter, Typography} from '@cisco-eti/spark-design';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {useWindowSize} from '@/hooks';
import {Link} from 'react-router-dom';
import FooterLogo from '@/assets/footer/footer.svg?react';
import {globalConfig} from '@/config/global';

export const Footer = () => {
  const {isMobile} = useWindowSize();
  return (
    <>
      <SparkFooter
        productNode={
          <div className="flex items-center gap-2 md:gap-4">
            <FooterLogo className="w-[90px] lg:w-fit" />
            <Link to={globalConfig.company.url} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none'}}>
              <Typography variant="caption" sx={(theme) => ({color: theme.palette.vars.baseTextDefault})}>
                <span className="text-[11px] lg:text-[12px]">
                  © {new Date().getFullYear()} {globalConfig.company.name}
                </span>
              </Typography>
            </Link>
          </div>
        }
        productName=""
        links={
          !isMobile
            ? [
                {
                  children: globalConfig.links.email,
                  href: `mailto:${globalConfig.links.email}`,
                  openInNewTab: true
                },
                {
                  children: 'Terms & Conditions',
                  href: globalConfig.links.termsAndConditions,
                  openInNewTab: true
                },
                {
                  children: 'Privacy Policy',
                  href: globalConfig.links.privacyPolicy,
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
                  children: <span className="text-[10px] lg:text-[12px]">Cookies</span>,
                  href: '#',
                  onClick: () => CookieConsentVanilla.showPreferences()
                }
              ]
        }
      />
    </>
  );
};
