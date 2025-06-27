/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {VerifyIdentityStepper} from '@/components/verify-identity/verify-identity-stepper';
import {PATHS} from '@/router/paths';

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
    >
      <VerifyIdentityStepper />
    </BasePage>
  );
};

export default VerifyIdentityPrivate;
