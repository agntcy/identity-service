/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import {CodeBlock, Link, Typography} from '@outshift/spark-design';
import {BadgeClaims} from '@/types/api/badge';

export const VerificationResults = () => {
  const methods = useStepper();
  const metaData = methods.getMetadata('verficationResults');
  const badgeClaims = metaData?.badgeClaims as BadgeClaims | undefined;

  const badge = JSON.parse(badgeClaims?.badge || '{}');

  return (
    <Card className="text-start space-y-6" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          Badge Information
        </Typography>
        <Link href="" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="p-0 ">
        <CodeBlock containerProps={{maxWidth: '50vw'}} showLineNumbers wrapLongLines text={JSON.stringify(badge, null, 2)} />
      </CardContent>
    </Card>
  );
};
