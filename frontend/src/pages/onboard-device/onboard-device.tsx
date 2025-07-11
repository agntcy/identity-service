/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PublicHeader} from '@/components/layout/public-header';
import {useParams} from 'react-router-dom';
import {ExternalLinkIcon} from 'lucide-react';
import {docs} from '@/utils/docs';
import {EmptyState, Link} from '@outshift/spark-design';
import {Footer as SparkFooter} from '@outshift/spark-design';
import {useEffect} from 'react';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {config} from '@/components/layout/cookie-consent/config';
import {ContentOnBoardDevice} from '@/components/onboard-device/content-onboard-device';
import {Card} from '@/components/ui/card';

const OnBoardDevice = () => {
  const {id} = useParams<{id: string}>();

  useEffect(() => {
    if (window) {
      void CookieConsentVanilla.run(config);
    } else {
      console.warn('CookieConsent is not available in this environment.');
    }
  }, []);

  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll relative">
      <div className="flex flex-col justify-between h-full">
        <PublicHeader
          userSection={
            <Link href={docs()} openInNewTab>
              <div className="flex items-center gap-1">
                Explore
                <ExternalLinkIcon className="w-4 h-4 ml-1" />
              </div>
            </Link>
          }
        />
        <div className="flex flex-col justify-center h-full">
          <ContentOnBoardDevice id={id} />
        </div>
        <SparkFooter
          productName="Cisco Systems, Inc."
          productLink="https://www.cisco.com/"
          links={[
            {
              children: 'Cookies',
              href: '#',
              onClick: () => CookieConsentVanilla.showPreferences()
            }
          ]}
        />
      </div>
    </div>
  );
};

export default OnBoardDevice;
