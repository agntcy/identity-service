/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {CreateUpdateApplication} from '@/components/application/create-update/create-update-application';
import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';

const CreateApplication: React.FC = () => {
  return (
    <BasePage
      title="Create Application"
      description={
        <div className="space-y-2">
          {/* <p>
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
          </p> */}
          TODO
        </div>
      }
      useBreadcrumbs={true}
      breadcrumbs={[
        {
          text: 'Applications',
          href: PATHS.applications
        },
        {
          text: 'Create Application'
        }
      ]}
    >
      <CreateUpdateApplication mode="create" />
    </BasePage>
  );
};

export default CreateApplication;
