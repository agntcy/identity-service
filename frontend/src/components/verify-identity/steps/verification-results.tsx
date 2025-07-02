/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import {Badge, Link, Toast, Typography} from '@outshift/spark-design';
import {BadgeClaims} from '@/types/api/badge';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {useMemo} from 'react';
import DateHover from '@/components/ui/date-hover';
import {cn} from '@/lib/utils';

export const VerificationResults = () => {
  const methods = useStepper();
  const metaData = methods.getMetadata('verficationResults');
  const badgeClaims = metaData?.badgeClaims as BadgeClaims | undefined;

  const badge = JSON.parse(badgeClaims?.badge || '{}');

  // TODO: Check status
  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Credential ID',
        value: badgeClaims?.id || 'Not provided'
      },
      {
        keyProp: 'Authors',
        value: badge?.authors?.length ? badge.authors.join(', ') : 'Not provided'
      },
      {
        keyProp: 'Created At',
        value: <DateHover date={badge?.created_at} />
      },
      {
        keyProp: 'Signature At',
        value: <DateHover date={badge?.signature?.signed_at} />
      },
      {
        keyProp: 'Badge Status',
        value: (
          <div className="flex items-center gap-2">
            <Badge content={null} type="error" styleBadge={{width: '6px', height: '6px', padding: '0'}} />
            <Typography color="#272E37" fontSize={14}>
              Revoked
            </Typography>
          </div>
        )
      }
    ];
    return temp;
  }, [badge, badgeClaims?.id]);

  return (
    <Card className={cn('text-start space-y-6')} variant="secondary">
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
      <CardContent className="p-0 flex justify-between items-center">
        <KeyValue pairs={keyValuePairs} useCard={false} />
        <Toast
          id="verification-results"
          title="Verification Results"
          description="The badge has been successfully verified. All claims are valid."
          type="success"
          className="w-full"
          showCloseButton={false}
        />
      </CardContent>
    </Card>
  );
};
