/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Button, CopyButton, toast, Typography} from '@outshift/spark-design';
import {useMemo, useState} from 'react';
import {App, AppStatus} from '@/types/api/app';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {Badge} from '@/types/api/badge';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {BadgeCard} from '@/components/shared/badge-card';
import {StatusAgenticService} from '@/components/shared/status-agentic-service';

export const CreateBadge = ({app}: {app?: App}) => {
  const [badge, setBadge] = useState<Badge | undefined>(undefined);

  const navigate = useNavigate();

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
        value: <StatusAgenticService status={badge?.verifiableCredential?.issuanceDate ? AppStatus.APP_STATUS_ACTIVE : app?.status} />
      }
    ];
    return temp;
  }, [app, badge]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-[50%] space-y-4">
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
        <div className="w-full h-full">
          <BadgeCard
            app={app}
            navigateTo={false}
            onBadgeChanged={(badge) => {
              setBadge(badge);
            }}
            showError={false}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            const path = generatePath(PATHS.agenticServices.info, {id: app?.id});
            void navigate(path, {replace: true});
          }}
          sx={{
            fontWeight: '600 !important'
          }}
        >
          {badge ? 'Done' : 'Skip'}
        </Button>
      </div>
    </div>
  );
};
