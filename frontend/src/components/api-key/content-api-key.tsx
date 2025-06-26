/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useSetApiKey} from '@/mutations';
import {useGetSettings} from '@/queries';
import {Button, Card, CopyButton, toast, Tooltip, Typography} from '@outshift/spark-design';
import {RefreshCcwIcon} from 'lucide-react';
import React, {useCallback} from 'react';
import {ConfirmModal} from '../ui/confirm-modal';

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
      <Card className="flex justify-between items-center w-full">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Typography variant="body2" fontWeight={600}>
              API Key:
            </Typography>
            <Typography variant="body2">
              {data?.apiKey?.apiKey ? `${'*'.repeat(55)}${data.apiKey.apiKey.slice(-3)}` : 'No API Key available'}
            </Typography>
          </div>
          <CopyButton
            text={data?.apiKey?.apiKey || ''}
            onCopy={() => {
              toast({
                title: 'API Key copied to clipboard',
                description: 'You can now use this API Key in your applications.',
                type: 'success'
              });
            }}
          />
        </div>

        <Tooltip title="Refresh API Key" placement="top">
          <Button
            onClick={() => handleChangeActionsModal(true)}
            variant="primary"
            color="negative"
            startIcon={<RefreshCcwIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </Tooltip>
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
