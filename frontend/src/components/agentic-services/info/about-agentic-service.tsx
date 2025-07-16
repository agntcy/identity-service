/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {CopyButton, toast, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import {App} from '@/types/api/app';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {BadgeCard} from '@/components/shared/badge-card';
import {StatusAgenticService} from '@/components/shared/status-agentic-service';
import DateHover from '@/components/ui/date-hover';
import {useAnalytics} from '@/hooks';

export const AboutAgenticService = ({app, onChangeReissueBadge}: {app?: App; onChangeReissueBadge?: (value: boolean) => void}) => {
  const {analyticsTrack} = useAnalytics();

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Identity',
        value: app?.resolverMetadataId || 'Not provided'
      },
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
      },
      {
        keyProp: 'Status',
        value: <StatusAgenticService status={app?.status} />
      },
      {
        keyProp: 'Created At',
        value: <DateHover date={app?.createdAt || 'Not provided'} />
      }
    ];
    return temp;
  }, [app]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-[50%] space-y-4">
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
            <Card className="text-start space-y-4" variant="secondary">
              <div className="flex justify-between items-center">
                <Typography variant="subtitle1" fontWeight={600}>
                  API Key
                </Typography>
              </div>
              <CardContent className="p-0 space-y-4">
                <div className="bg-[#FBFCFE] border border-[#D5DFF7] rounded-[6px] w-fit py-2 px-4 flex justify-between items-center gap-8 w-full">
                  <Typography variant="body2">{app?.apiKey ? `${'*'.repeat(20)}${app.apiKey.slice(-5)}` : 'No API Key available'}</Typography>
                  <CopyButton
                    text={app?.apiKey || ''}
                    style={{border: 'none'}}
                    onCopy={() => {
                      analyticsTrack('CLICK_COPY_API_KEY_AGENTIC_SERVICE');
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
            <BadgeCard
              app={app}
              navigateTo={false}
              onBadgeChanged={(badge) => {
                if (badge?.verifiableCredential?.id) {
                  onChangeReissueBadge?.(true);
                } else {
                  onChangeReissueBadge?.(false);
                }
              }}
              showError={false}
            />
          </div>
        </div>
      </div>
    </>
  );
};
