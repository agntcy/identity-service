/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {GeneralSize, Link, Tag, Typography} from '@open-ui-kit/core';
import {useMemo} from 'react';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-services/agentic-service-type';
import {Policy} from '@/types/api/policy';
import {useGetAgenticService} from '@/queries';
import {generatePath} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {RulesContent} from './rules-content';

export const PolicyContent = ({policy}: {policy?: Policy}) => {
  const {data} = useGetAgenticService(policy?.assignedTo);

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Name',
        value: policy?.name || 'Not provided'
      },
      {
        keyProp: 'Assigned To',
        value: (
          <Tag size={GeneralSize.Small}>
            <div className="flex items-center gap-2">
              <AgenticServiceType type={data?.type} showLabel={false} />
              <Link href={generatePath(PATHS.agenticServices.info.base, {id: policy?.assignedTo || ''})}>
                <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
              </Link>
            </div>
          </Tag>
        )
      },
      {
        keyProp: 'Description',
        value: policy?.description || 'Not provided'
      }
    ];
    return temp;
  }, [data?.name, data?.type, policy?.assignedTo, policy?.description, policy?.name]);

  return (
    <>
      <div className="flex gap-4">
        <div className="w-[40%]">
          <Card className="text-start space-y-6" variant="secondary">
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" fontWeight={600}>
                About
              </Typography>
            </div>
            <CardContent className="p-0 space-y-4">
              <KeyValue pairs={keyValuePairs} useCard={false} orientation="vertical" />
            </CardContent>
          </Card>
        </div>
        <RulesContent policy={policy} />
      </div>
    </>
  );
};
