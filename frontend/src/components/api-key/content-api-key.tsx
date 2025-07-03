/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useSetApiKey} from '@/mutations';
import {useGetSettings} from '@/queries';
import {Button, CardContent, CopyButton, toast, Tooltip, Typography} from '@outshift/spark-design';
import {RefreshCcwIcon} from 'lucide-react';
import React, {useCallback} from 'react';
import {ConfirmModal} from '../ui/confirm-modal';
import {Card} from '../ui/card';

export const ContentApiKey: React.FC = () => {
  const [openActionsModal, setOpenActionsModal] = React.useState(false);

  const {data, error, isLoading, isFetching, refetch} = useGetSettings();

  const setApiKeyMutation = useSetApiKey({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'API Key refreshed successfully',
          description: 'Your API Key has been refreshed. Please update your applications with the new key.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error refreshing API Key',
          description: 'There was an error while trying to refresh your API Key. Please try again later.',
          type: 'error'
        });
      }
    }
  });

  const handleChangeActionsModal = useCallback((value: boolean) => {
    setOpenActionsModal(value);
  }, []);

  const handleConfirmAction = useCallback(() => {
    setApiKeyMutation.mutate();
    handleChangeActionsModal(false);
  }, [setApiKeyMutation, handleChangeActionsModal]);

  return (
    <ConditionalQueryRenderer
      itemName="Api Key"
      data={data?.apiKey?.apiKey}
      error={error}
      isLoading={isLoading || isFetching}
      useRelativeLoader
      useContainer
      emptyListStateProps={{
        actionCallback: () => {
          setApiKeyMutation.mutate();
        },
        actionTitle: 'Create API Key'
      }}
      errorListStateProps={{
        actionCallback: () => {
          void refetch();
        },
        actionTitle: 'Retry'
      }}
    >
      <Card className="w-full bg-[#F5F8FD] p-4">
        <CardContent>
          <div className="flex flex-col gap-4">
            <Typography variant="body1Semibold">API Key</Typography>
            <div className="bg-[#FBFCFE] border-[2px] border-[#D5DFF7] rounded-[4px] w-fit py-2 px-4 flex justify-between items-center gap-4">
              <Typography variant="body2">
                {data?.apiKey?.apiKey ? `${'*'.repeat(55)}${data.apiKey.apiKey.slice(-5)}` : 'No API Key available'}
              </Typography>
              <CopyButton
                text={data?.apiKey?.apiKey || ''}
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
            <div className="flex justify-end">
              <Tooltip title="Refresh API Key">
                <Button onClick={() => handleChangeActionsModal(true)} startIcon={<RefreshCcwIcon className="w-4 h-4" />}>
                  Refresh
                </Button>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmModal
        open={openActionsModal}
        title="Confirm Action"
        description="Are you sure you want to refresh your API Key? This action will invalidate your current API Key and generate a new one. Please ensure that you update your applications accordingly."
        confirmButtonText="Refresh API Key"
        onCancel={() => handleChangeActionsModal(false)}
        onConfirm={handleConfirmAction}
      />
    </ConditionalQueryRenderer>
  );
};
