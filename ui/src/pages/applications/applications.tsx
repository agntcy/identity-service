/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {EmptyProvider} from '@/components/shared/empty-provider';
import {Button} from '@/components/ui/button';
import PlaceholderPageContent from '@/components/ui/placeholder-page-content';
import {useStore} from '@/store';
import {PlusIcon} from 'lucide-react';
import {useShallow} from 'zustand/react/shallow';

const Applications: React.FC = () => {
  const {identityProvider, passwordManagementProvider} = useStore(
    useShallow((store) => ({
      identityProvider: store.identityProvider,
      passwordManagementProvider: store.passwordManagementProvider
    }))
  );

  return (
    <BasePage
      title="Applications"
      description={
        <div className="space-y-4 max-w-[80%]">
          {/* <p>
            The <b>AGNTCY</b> supports various types of verifiable credentials, referred to as <b>VCs</b>. A verifiable credential is a specific way
            to express and present a set of claims made by an issuer, such as an agent definition (e.g., an <b>OASF Definition</b>, or an{' '}
            <b>A2A Agent Card</b>), a deployment configuration, or an authorization claim that could be used during a MFA process.
          </p>
          <p>
            You can check more info{' '}
            <Link to="https://spec.identity.agntcy.org/docs/category/verifiable-credentials" className="inline-link" target="_blank">
              here
            </Link>
            .
          </p> */}
          TODO
        </div>
      }
      useBreadcrumbs={false}
      rightSideItems={
        <Button className="flex gap-2 items-center">
          Create Application
          <PlusIcon />
        </Button>
      }
    >
      {identityProvider && passwordManagementProvider ? <PlaceholderPageContent /> : <EmptyProvider />}
    </BasePage>
  );
};

export default Applications;
