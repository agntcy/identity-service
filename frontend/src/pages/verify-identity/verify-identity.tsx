/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {VerifyIdentityStepper} from '@/components/verify-identity/verify-identity-stepper';
import {ExternalLinkIcon} from 'lucide-react';
import {docs} from '@/utils/docs';
import {Link} from '@open-ui-kit/core';
import {useParams} from 'react-router-dom';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetAgenticServiceBadge} from '@/queries';

const VerifyIdentity: React.FC = () => {
  const {id} = useParams<{id: string}>();

  const {data, isLoading, error, refetch} = useGetAgenticServiceBadge(id);

  return (
    <BasePage
      title="Verify Identity"
      rightSideItems={
        <Link href={docs('verify')} openInNewTab>
          <div className="flex items-center gap-1">
            View Documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      }
    >
      <ConditionalQueryRenderer
        itemName="Verify Identity Badge"
        data={data}
        error={error}
        isLoading={isLoading}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
        bypass={!id}
      >
        <VerifyIdentityStepper badge={data} />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default VerifyIdentity;
