/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Link} from 'react-router-dom';
import {ExternalLinkIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import StatsCard from '@/components/ui/stats-card';
import {labels} from '@/constants/labels';

export const RegisterProvider = ({isLoading = false}: {isLoading?: boolean}) => {
  const methods = useStepper();
  const metaData = methods.getMetadata('providerInfo');

  const provider = metaData?.provider;
  const issuer = metaData?.issuer;
  const clientId = metaData?.clientId;
  const clientSecret = metaData?.clientSecret as string | undefined;

  return (
    <Card className="text-start py-4" variant="secondary">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Identity Provider Information</CardTitle>
        <Link
          to="https://github.com/agntcy/identity?tab=readme-ov-file#step-3-register-as-an-issuer"
          className="button-link flex gap-2 items-center"
          target="_blank"
        >
          View Documentation
          <ExternalLinkIcon className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="px-6 pt-4 space-y-4">
        <StatsCard
          stats={[
            {
              title: 'Provider Type',
              value: labels.providerTypes[provider as keyof typeof labels.providerTypes] || 'Not provided'
            },
            {
              title: 'Client Issuer',
              value: issuer || 'Not provided'
            },
            {
              title: 'Client ID',
              value: clientId || 'Not provided'
            },
            {
              title: 'Client Secret',
              value: clientSecret ? `${'*'.repeat(15)}${clientSecret.slice(-3)}` : 'Not provided'
            }
          ]}
        />
      </CardContent>
    </Card>
  );
};
