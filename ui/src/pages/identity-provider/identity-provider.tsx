/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateUpdateIdentityProvider} from '@/components/identity-provider/create-update-identity-provider';
import {BasePage} from '@/components/layout/base-page';
import {Link} from 'react-router-dom';

const IdentityProvider: React.FC = () => {
  return (
    <BasePage
      title="Identity Provider"
      description={
        <div className="space-y-4 max-w-[80%]">
          <p>
            The <b>AGNTCY</b> supports various types of identities, referred to as IDs, which serve as universally unique identifiers for the main
            entities or subjects operated by the <b>AGNTCY</b>, including Agents and Multi-Agent Systems (MAS).
          </p>
          <p>
            Each ID is associated 1:1 with <b>ResolverMetadata</b>, which contains the necessary information to establish trust while trying to use or
            interact with an Agent or a MAS <b>ID</b>. You can check more info{' '}
            <Link to="https://spec.identity.agntcy.org/docs/category/identifiers" className="inline-link" target="_blank">
              here
            </Link>
            .
          </p>
        </div>
      }
      useBreadcrumbs={false}
    >
      <CreateUpdateIdentityProvider />
    </BasePage>
  );
};

export default IdentityProvider;
