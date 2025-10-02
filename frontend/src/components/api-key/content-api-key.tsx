/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useSetApiKey} from '@/mutations';
import {useGetSettings} from '@/queries';
import {CardContent, CopyButton, toast, Typography} from '@open-ui-kit/core';
import {EllipsisVerticalIcon, RefreshCcwIcon} from 'lucide-react';
import React, {useCallback, useState} from 'react';
import {ConfirmModal} from '../ui/confirm-modal';
import {Card} from '../ui/card';
import {useAnalytics} from '@/hooks';
import {IconButton, Menu, MenuItem, Tooltip} from '@mui/material';

export const ContentApiKey: React.FC = () => {
  const [openActionsModal, setOpenActionsModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const {data, error, isLoading, isFetching, refetch} = useGetSettings();

  const {analyticsTrack} = useAnalytics();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
    analyticsTrack('CLICK_CONFIRM_REFRESH_API_KEY');
    setApiKeyMutation.mutate();
    handleChangeActionsModal(false);
  }, [analyticsTrack, setApiKeyMutation, handleChangeActionsModal]);

  return (
    <ConditionalQueryRenderer
      itemName="API Key"
      data={data?.apiKey?.apiKey}
      error={error}
      isLoading={isLoading || isFetching}
      useRelativeLoader
      emptyListStateProps={{
        actionCallback: () => {
          analyticsTrack('CLICK_CREATE_API_KEY');
          setApiKeyMutation.mutate();
        },
        actionTitle: 'Create API Key'
      }}
      errorListStateProps={{
        actionCallback: () => {
          void refetch();
        }
      }}
    >
      <Card className="text-start space-y-6" variant="secondary">
        <div className="flex justify-between items-start">
          <Typography variant="subtitle1" fontWeight={600}>
            API Key
          </Typography>
          <div>
            <Tooltip title="Actions" arrow>
              <IconButton
                sx={(theme) => ({
                  color: theme.palette.vars.baseTextDefault,
                  width: '24px',
                  height: '24px'
                })}
                onClick={handleClick}
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </IconButton>
            </Tooltip>
            <Menu
              transformOrigin={{horizontal: 'right', vertical: 'top'}}
              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
            >
              <MenuItem
                key="refresh-api-key"
                onClick={() => {
                  analyticsTrack('CLICK_REFRESH_API_KEY');
                  handleChangeActionsModal(true);
                }}
                sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
              >
                <RefreshCcwIcon className="w-4 h-4" color="#062242" />
                <Typography variant="body2" color="#062242">
                  Refresh
                </Typography>
              </MenuItem>
            </Menu>
          </div>
        </div>
        <CardContent>
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
