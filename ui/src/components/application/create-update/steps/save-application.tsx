/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Link} from 'react-router-dom';
import {ExternalLinkIcon} from 'lucide-react';
import StatsCard from '@/components/ui/stats-card';
import {useStepper} from '../stepper';
import {labels} from '@/constants/labels';

export const SaveApplication = ({isLoading = false}: {isLoading?: boolean}) => {
  const methods = useStepper();
  const appType = methods.getMetadata('applicationType')?.type;
  const sourceType = methods.getMetadata('sourceInfo')?.type;
  const sourceText = methods.getMetadata('sourceInfo')?.text;

  return (
    <Card className="text-start py-4" variant="secondary">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Application Information</CardTitle>
        <Link to="" className="button-link flex gap-2 items-center" target="_blank">
          View Documentation
          <ExternalLinkIcon className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="px-6 pt-4 space-y-4">
        <StatsCard
          className="lg:grid-cols-3"
          stats={[
            {
              title: 'Application Type',
              value: labels.appTypes[appType as keyof typeof labels.appTypes] || 'Not provided'
            },
            {
              title: 'Source Type',
              value: labels.sourceAppTypes[sourceType as keyof typeof labels.sourceAppTypes] || 'Not provided'
            },
            {
              title: 'Source',
              value: sourceText || 'Not provided'
            }
          ]}
        />
      </CardContent>
    </Card>
  );
};
