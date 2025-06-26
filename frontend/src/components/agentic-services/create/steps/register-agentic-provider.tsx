/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import StatsCard, {Stat} from '@/components/ui/stats-card';
import {labels} from '@/constants/labels';
import {Link, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import {LoaderRelative} from '@/components/ui/loading';
import {AgenticServiceFormValues} from '@/schemas/agentic-service-schema';
import {AppType} from '@/types/api/app';

export const RegisterAgenticProvider = ({isLoading = false}: {isLoading?: boolean}) => {
  const methods = useStepper();
  const metaData = methods.getMetadata('agenticServiceInfo') as AgenticServiceFormValues | undefined;

  const type = metaData?.type;
  const name = metaData?.name;
  const description = metaData?.description;
  const mcpServer = metaData?.mcpServer;

  const stats: Stat[] = useMemo(() => {
    const temp: Stat[] = [
      {
        title: 'Name',
        value: name || 'Not provided'
      },
      {
        title: 'Description',
        value: description || 'Not provided'
      },
      {
        title: 'Type',
        value: labels.appTypes[type as keyof typeof labels.appTypes] || 'Not provided'
      }
    ];
    if (type === AppType.APP_TYPE_MCP_SERVER) {
      temp.push({
        title: 'MCP Server',
        value: mcpServer || 'Not provided'
      });
    }
    return temp;
  }, [description, mcpServer, name, type]);

  if (isLoading) {
    return (
      <Card className="text-start py-4 bg-[#F5F8FD] rounded-[8px] p-[24px] space-y-4" variant="secondary">
        <LoaderRelative />
      </Card>
    );
  }

  return (
    <Card className="text-start py-4 bg-[#F5F8FD] rounded-[8px] p-[24px] space-y-4" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          Agentic Service Information
        </Typography>
        <Link href="" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="p-0 space-y-4">
        <StatsCard stats={stats} />
      </CardContent>
    </Card>
  );
};
