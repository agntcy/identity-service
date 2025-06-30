/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {PublicHeader} from '@/components/layout/public-header';
import {VerifyIdentityStepper} from '@/components/verify-identity/verify-identity-stepper';

const VerifyIdentityPublic: React.FC = () => {
  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll h-screen">
      <PublicHeader />
      <div className="h-[56px]" />
      <div className="h-full">
        <BasePage title="Verify Identity" useBorder>
          <VerifyIdentityStepper />
        </BasePage>
      </div>
    </div>
  );
};

export default VerifyIdentityPublic;
