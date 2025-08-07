/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {CopyButton, IconButton, toast, Typography} from '@outshift/spark-design';
import {useCallback, useMemo, useState} from 'react';
import {App} from '@/types/api/app';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-services/agentic-service-type';
import {StatusAgenticService} from '@/components/shared/agentic-services/status-agentic-service';
import DateHover from '@/components/ui/date-hover';
import {useAnalytics} from '@/hooks';
import {BadgeCard} from '@/components/shared/agentic-services/badge-card';
import {Menu, MenuItem, Tooltip} from '@mui/material';
import {EllipsisVerticalIcon, RefreshCcwIcon} from 'lucide-react';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useRefreshAgenticServiceApiKey} from '@/mutations';
import {LoaderRelative} from '@/components/ui/loading';

export const ContentAboutAgenticService = ({
  app,
  onChangeReissueBadge
}: {
  app?: App;
  onChangeReissueBadge?: (value: boolean) => void;
}) => {
  const [openActionsModal, setOpenActionsModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  const refreshApiKeyMutation = useRefreshAgenticServiceApiKey({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'API Key refreshed successfully',
          description: 'The API Key has been refreshed. Please update your applications accordingly.',
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error refreshing API Key',
          description: 'There was an error refreshing the API Key. Please try again later.',
          type: 'error'
        });
      }
    }
  });

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleChangeActionsModal = useCallback((value: boolean) => {
    setOpenActionsModal(value);
  }, []);

  const handleConfirmAction = useCallback(() => {
    analyticsTrack('CLICK_CONFIRM_REFRESH_API_KEY_AGENTIC_SERVICE');
    refreshApiKeyMutation.mutate(app?.id || '');
    handleChangeActionsModal(false);
  }, [analyticsTrack, app?.id, handleChangeActionsModal, refreshApiKeyMutation]);

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
                        analyticsTrack('CLICK_REFRESH_API_KEY_AGENTIC_SERVICE');
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
              <CardContent className="p-0 space-y-4">
                {refreshApiKeyMutation.isPending ? (
                  <div>
                    <LoaderRelative />
                  </div>
                ) : (
                  <div className="bg-[#FBFCFE] border border-[#D5DFF7] rounded-[6px] w-fit py-2 px-4 flex justify-between items-center gap-8 w-full">
                    <Typography variant="body2">
                      {app?.apiKey ? `${'*'.repeat(20)}${app.apiKey.slice(-5)}` : 'No API Key available'}
                    </Typography>
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
                )}
              </CardContent>
            </Card>
          </div>
          <div className="w-full">
            <BadgeCard
              verifyIdentity={true}
              reIssueBadge={true}
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
      <ConfirmModal
        open={openActionsModal}
        title="Confirm Action"
        description="Are you sure you want to refresh the API Key of the Agentic Service? This will invalidate the current key."
        onCancel={() => handleChangeActionsModal(false)}
        onConfirm={handleConfirmAction}
      />
    </>
  );
};
