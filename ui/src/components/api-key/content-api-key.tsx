/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useSetApiKey} from '@/mutations';
import {useGetSettings} from '@/queries';
import {Button, Card, CopyButton, ActionsModal, toast, Tooltip, Typography} from '@outshift/spark-design';
import {RefreshCcwIcon} from 'lucide-react';
import React, {useCallback} from 'react';

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
          <Typography variant="body2">{data?.apiKey?.apiKey ? `${data.apiKey.apiKey.slice(0, -5)}*****` : 'No API Key available'}</Typography>
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
      <ActionsModal
        footerProps={{
          sx: {
            display: 'flex',
            alignContent: 'space-between',
            justifyContent: 'flex-end',
            gap: '16px',
            padding: '0',
            paddingTop: '16px'
          }
        }}
        title="Confirm Action"
        hideModal={() => handleChangeActionsModal(false)}
        open={openActionsModal}
        confirmClicked={() => handleConfirmAction()}
        mutationLoading={false}
        bodyText="Are you sure you want to refresh your API Key? This action will invalidate your current API Key and generate a new one. Please ensure that you update your applications accordingly."
      />
    </ConditionalQueryRenderer>
  );
};
