/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import {Link, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import {AgenticServiceFormValues} from '@/schemas/agentic-service-schema';
import {AppType} from '@/types/api/app';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';

export const RegisterAgenticProvider = () => {
  const methods = useStepper();
  const metaData = methods.getMetadata('agenticServiceInfo') as AgenticServiceFormValues | undefined;

  const type = metaData?.type;
  const name = metaData?.name;
  const description = metaData?.description;
  const mcpServer = metaData?.mcpServer;

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
    if (type === AppType.APP_TYPE_MCP_SERVER) {
      temp.push({
        keyProp: 'MCP Server URL',
        value: mcpServer || 'Not provided'
      });
    }
    return temp;
  }, [description, mcpServer, name, type]);

  return (
    <Card className="text-start space-y-6" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          About
        </Typography>
        <Link href="" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="p-0 space-y-4">
        <KeyValue pairs={keyValuePairs} useCard={false} />
      </CardContent>
    </Card>
  );
};
