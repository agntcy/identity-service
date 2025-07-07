/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {VerifyIdentityStepper} from '@/components/verify-identity/verify-identity-stepper';
import {PATHS} from '@/router/paths';
import {ExternalLinkIcon} from 'lucide-react';
import {docs} from '@/utils/docs';
import {Link} from '@outshift/spark-design';

const VerifyIdentityPrivate: React.FC = () => {
  return (
    <BasePage
      title="Verify Identity"
      useBorder
      breadcrumbs={[
        {
          link: PATHS.agenticServices.base,
          text: 'Agentic Services'
        },
        {
          text: 'Verify Identity'
        }
      ]}
      rightSideItems={
        <Link href={docs('verify')} openInNewTab>
          <div className="flex items-center gap-1">
            View Documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      }
    >
      <VerifyIdentityStepper />
    </BasePage>
  );
};

export default VerifyIdentityPrivate;
