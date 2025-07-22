/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {useStepper} from '../stepper';
import {Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import {AgenticServiceFormValues} from '@/schemas/agentic-service-schema';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-services/agentic-service-type';

export const ConfirmInfo = () => {
  const methods = useStepper();
  const metaData = methods.getMetadata('agenticServiceForm') as AgenticServiceFormValues | undefined;

  const type = metaData?.type;
  const name = metaData?.name;
  const description = metaData?.description;

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Name',
        value: name || 'Not provided'
      },
      {
        keyProp: 'Description',
        value: description || 'Not provided'
      },
      {
        keyProp: 'Type',
        value: <AgenticServiceType type={type} />
      }
    ];
    return temp;
  }, [description, name, type]);

  return (
    <Card className="text-start space-y-6" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          About
        </Typography>
      </div>
      <CardContent className="p-0 space-y-4">
        <KeyValue pairs={keyValuePairs} useCard={false} />
      </CardContent>
    </Card>
  );
};
