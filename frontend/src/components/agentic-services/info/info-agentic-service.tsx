/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon, PlusIcon} from 'lucide-react';
import {CodeBlock, CopyButton, EmptyState, GeneralSize, Link, toast, Typography} from '@outshift/spark-design';
import {useCallback, useMemo, useState} from 'react';
import {App} from '@/types/api/app';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {Badge} from '@/types/api/badge';
import {LoaderRelative} from '@/components/ui/loading';
import {useIssueBadge} from '@/mutations/badge';

export const InfoAgenticService = ({app}: {app?: App}) => {
  const [badge, setBadge] = useState<Badge | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const createBadge = useIssueBadge({
    callbacks: {
      onSuccess: (resp) => {
        setIsLoading(false);
        setBadge(resp.data);
        toast({
          title: 'Badge created successfully',
          description: 'You can now use this badge in your applications.',
          type: 'success'
        });
      },
      onError: () => {
        setIsLoading(false);
        toast({
          title: 'Error creating badge',
          description: 'There was an error while trying to create the badge. Please try again later.',
          type: 'error'
        });
      }
    }
  });

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Name',
        value: app?.name || 'Not provided'
      },
      {
        keyProp: 'Description',
        value: app?.description || 'Not provided'
      },
      {
        keyProp: 'Type',
        value: <AgenticServiceType type={app?.type} />
      }
    ];
    return temp;
  }, [app?.description, app?.name, app?.type]);

  const handleCreateBadge = useCallback(() => {
    setIsLoading(true);
    createBadge.mutate({
      id: app?.id || '',
      data: {}
    });
  }, [app?.id, createBadge]);

  return (
    <div className="flex gap-4">
      <div className="w-[45%] space-y-2">
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
        <Card className="text-start space-y-6" variant="secondary">
          <div className="flex justify-between items-center">
            <Typography variant="subtitle1" fontWeight={600}>
              API Key
            </Typography>
            <Link href="" openInNewTab>
              <div className="flex items-center gap-1">
                View documentation
                <ExternalLinkIcon className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </div>
          <CardContent className="p-0 space-y-4">
            <div className="bg-[#FBFCFE] border border-[#D5DFF7] rounded-[6px] w-fit py-2 px-4 flex justify-between items-center gap-8 w-full">
              <Typography variant="body2">{app?.apiKey ? `${'*'.repeat(20)}${app.apiKey.slice(-5)}` : 'No API Key available'}</Typography>
              <CopyButton
                text={app?.apiKey || ''}
                style={{border: 'none'}}
                onCopy={() => {
                  toast({
                    title: 'API Key copied to clipboard',
                    description: 'You can now use this API Key in your applications.',
                    type: 'success'
                  });
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-full">
        <Card variant="secondary" className="h-full flex flex-col justify-center">
          {isLoading ? (
            <LoaderRelative />
          ) : !badge ? (
            <EmptyState
              size={GeneralSize.Medium}
              title="No ID badge"
              description="In order to create an ID badge for an A2A instance, complete source url and credentials in previous step."
              actionTitle="Create ID badge"
              actionCallback={() => handleCreateBadge()}
              actionButtonProps={{
                sx: {fontWeight: '600 !important'},
                startIcon: <PlusIcon className="w-4 h-4" />
              }}
            />
          ) : null}
        </Card>
      </div>
    </div>
  );
};
