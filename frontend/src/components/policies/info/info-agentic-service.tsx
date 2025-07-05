/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Accordion, Divider, GeneralSize, Tag, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {Policy} from '@/types/api/policy';
import {useGetAgenticService} from '@/queries';
import {Separator} from '@/components/ui/separator';
import {labels} from '@/constants/labels';

export const InfoPolicy = ({policy}: {policy?: Policy}) => {
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
          <div className="flex items-center gap-2">
            <AgenticServiceType type={data?.type} className="h-[20px] w-[20px]" showLabel={false} />
            <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
          </div>
        )
      },
      {
        keyProp: 'Description',
        value: policy?.description || 'Not provided'
      }
    ];
    return temp;
  }, [data?.name, data?.type, policy?.description, policy?.name]);

  return (
    <>
      <div className="flex gap-4">
        <div className="w-[40%]">
          <Card className="text-start space-y-4" variant="secondary">
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
        <div className="w-full">
          <Card className="text-start space-y-4" variant="secondary">
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" fontWeight={600}>
                Policy Logic
              </Typography>
            </div>
            <CardContent className="p-0 space-y-4">
              <div className="pt-4">
                {policy?.rules?.map((rule, index) => (
                  <div className="w-full mb-4" key={index}>
                    <Accordion
                      title={rule.name || `Rule ${index + 1}`}
                      subTitle={
                        (
                          <div className="flex gap-4 items-center h-[24px]">
                            <Separator orientation="vertical" />
                            <Tag size={GeneralSize.Small}>{labels.rulesActions[rule.action ?? 'RULE_ACTION_UNSPECIFIED']}</Tag>
                          </div>
                        ) as any
                      }
                    >
                      <div className="pl-6">{/* <RuleForm isLoading={isLoading} fieldIndex={index} /> */}</div>
                    </Accordion>
                    <div className="mt-4">
                      <Divider />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
