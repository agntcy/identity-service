/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PublicHeader} from '@/components/layout/public-header';
import {ExternalLinkIcon} from 'lucide-react';
import {docs} from '@/utils/docs';
import {Link} from '@outshift/spark-design';
import {Footer as SparkFooter} from '@outshift/spark-design';
import * as CookieConsentVanilla from 'vanilla-cookieconsent';
import {ContentOnBoardDevice} from '@/components/onboard-device/content-onboard-device';

const OnBoardDevice = () => {
  return (
    <>
      <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll relative overflow-hidden h-dvh">
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
            <ContentOnBoardDevice />
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
    </>
  );
};

export default OnBoardDevice;
