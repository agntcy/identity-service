/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {Button, Typography} from '@mui/material';
import {Card} from '../ui/card';
import {BellIcon, BellOffIcon, RefreshCcwIcon} from 'lucide-react';
import {GeneralSize, Tag, TagStatus} from '@open-ui-kit/core';
import {useNotificationUtils} from '@/providers/notification-utils-provider/notification-utils-provider';

export const ContentOnBoardDevice = ({id}: {id?: string}) => {
  const {enabled, supported, handleToggleNotifications, fixNotifications, loading} = useNotificationUtils();
  return (
    <>
      <div className="px-4">
        <Card variant="secondary" className="w-full max-w-md mx-auto space-y-6">
          <div className="flex gap-4 items-center">
            {enabled ? <BellIcon className="h-5 w-5 text-green-600" /> : <BellOffIcon className="h-5 w-5 text-gray-400" />}
            <Typography variant="body1Semibold">Notification Status</Typography>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Typography variant="captionSemibold">Push Notifications</Typography>
              <Tag
                size={GeneralSize.Small}
                status={!supported ? TagStatus.Negative : enabled ? TagStatus.Positive : TagStatus.Info}
                className="text-xs"
              >
                {supported ? (enabled ? 'Enabled' : 'Disabled') : 'Not Supported'}
              </Tag>
            </div>
            <div className="pt-2">
              <Button
                startIcon={enabled ? <BellOffIcon className="w-4 h-4" /> : <BellIcon className="w-4 h-4" />}
                onClick={() => handleToggleNotifications(id)}
                fullWidth
                variant={enabled ? 'outlined' : 'primary'}
                sx={{fontWeight: 'bold !important'}}
                loading={loading}
                loadingPosition="start"
                disabled={!supported}
              >
                {enabled ? 'Disable Notifications' : 'Enable Notifications'}
              </Button>
            </div>
            {supported && enabled && (
              <div>
                <Button
                  onClick={fixNotifications}
                  fullWidth
                  variant="secondary"
                  startIcon={<RefreshCcwIcon className="w-4 h-4" />}
                  sx={{fontWeight: 'bold !important'}}
                  disabled={!supported || loading}
                >
                  Fix Notification Issues
                </Button>
              </div>
            )}
            {supported && enabled && (
              <>
                <div className="text-center">
                  <Typography variant="caption">
                    {enabled
                      ? "You'll receive notifications with Allow/Deny actions. Responses are tracked automatically."
                      : 'Enable notifications to receive allow/deny prompts from the web dashboard.'}
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography variant="captionMedium">
                    If notifications show a 404 error when tapped, use &quot;Fix Notification Issues&quot; button above.
                  </Typography>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
