/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {CheckIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import {Badge, Typography} from '@outshift/spark-design';
import {BadgeClaims, VerifiableCredential} from '@/types/api/badge';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {useMemo} from 'react';
import DateHover from '@/components/ui/date-hover';
import {cn} from '@/lib/utils';

export const VerificationResults = () => {
  const methods = useStepper();
  const metaData = methods.getMetadata('verficationResults') as VerifiableCredential | undefined;
  console.log(metaData);
  // const badgeClaims = metaData?.badgeClaims as BadgeClaims | undefined;

  // const badge = JSON.parse(badgeClaims?.badge || '{}');

  // TODO: Check status
  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Identity',
        value: metaData?.credentialSubject?.id || 'Not provided'
      },
      {
        keyProp: 'Issuer',
        value: metaData?.issuer || 'Not provided'
      },
      {
        keyProp: 'Issued At',
        value: <DateHover date={metaData?.issuanceDate} />
      }
      // {
      //   keyProp: 'Authors',
      //   value: badge?.authors?.length ? badge.authors.join(', ') : 'Not provided'
      // },
      // {
      //   keyProp: 'Created At',
      //   value: <DateHover date={badge?.created_at} />
      // },
      // {
      //   keyProp: 'Signature At',
      //   value: <DateHover date={badge?.signature?.signed_at} />
      // },
      // {
      //   keyProp: 'Badge Status',
      //   value: (
      //     <div className="flex items-center gap-2">
      //       <Badge content={null} type="success" styleBadge={{width: '6px', height: '6px', padding: '0'}} />
      //       <Typography color="#272E37" fontSize={14}>
      //         Active
      //       </Typography>
      //     </div>
      //   )
      // }
    ];
    return temp;
  }, []);

  return (
    <div className="flex gap-4">
      <div>
        <Card className={cn('text-start space-y-6')} variant="secondary">
          <div className="flex justify-between items-center">
            <Typography variant="subtitle1" fontWeight={600}>
              Badge Information
            </Typography>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-[20px] h-[20px] text-[#00B285]" />
              <Typography variant="body2Semibold">Verification successful</Typography>
            </div>
          </div>
          <CardContent className="p-0 flex justify-between items-center">
            <KeyValue pairs={keyValuePairs} useCard={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
