/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useCallback, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {BellIcon, ChevronDownIcon, ChevronUpIcon, LogOutIcon} from 'lucide-react';
import {Avatar, Button, Divider, Header as SparkHeader, Menu, MenuItem, Typography} from '@outshift/spark-design';
import Logo from '@/assets/logo-app-bar.svg?react';
import BookLogo from '@/assets/union.svg?react';
import GitLogo from '@/assets/git.svg?react';
import UserIcon from '@/assets/user.svg?react';
import {Link} from 'react-router-dom';
import {useAnalytics, useAuth, useWindowSize} from '@/hooks';
import {docs} from '@/utils/docs';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import LogoIcon from '@/assets/icon-agntcy.svg?react';
import {NotificationSettings} from '../shared/notifications/notification-settings';

export const Header = () => {
  const {width} = useWindowSize();
  const isMobile = width < 768;

  const [openNotificationSettings, setOpenNotificationSettings] = useState(false);

  const {analyticsTrack} = useAnalytics();

  const handleNotificationsChange = useCallback((value: boolean) => {
    setOpenNotificationSettings(value);
  }, []);

  return (
    <>
      <SparkHeader
        title={
          <Link to={PATHS.dashboard} className="flex items-center gap-2">
            <Typography
              variant="h1"
              fontWeight={700}
              fontSize={isMobile ? '16px' : '18px'}
              lineHeight="18px"
              sx={(theme) => ({color: theme.palette.vars.brandTextSecondary})}
            >
              Agent Identity
            </Typography>
          </Link>
        }
        logo={
          <Link to={PATHS.dashboard}>
            <Logo className="hidden md:block" />
            <LogoIcon className="w-8 h-8 md:hidden" />
          </Link>
        }
        position="fixed"
        actions={
          width >= 768
            ? [
                {
                  id: 'docs',
                  icon: <BookLogo />,
                  tooltip: 'View Documentation',
                  href: docs(),
                  'aria-label': 'documentation',
                  target: '_blank',
                  onClick: () => analyticsTrack('CLICK_DOCS')
                },
                {
                  id: 'github',
                  icon: <GitLogo />,
                  tooltip: 'View GitHub',
                  href: 'https://github.com/agntcy/identity',
                  'aria-label': 'github',
                  target: '_blank',
                  onClick: () => analyticsTrack('CLICK_GITHUB')
                }
              ]
            : undefined
        }
        useDivider={!isMobile}
        userSection={<UserSection handleNotificationsChange={handleNotificationsChange} />}
      />
      <NotificationSettings open={openNotificationSettings} onClose={() => handleNotificationsChange(false)} />
    </>
  );
};

const UserSection = ({handleNotificationsChange}: {handleNotificationsChange: (value: boolean) => void}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const {width} = useWindowSize();
  const isMobile = width < 768;

  const navigate = useNavigate();
  const {authInfo, logout} = useAuth();

  const {session} = useSettingsStore(
    useShallow((state) => ({
      session: state.session
    }))
  );

  const role = useMemo(() => {
    const temp = session?.groups[0]?.role || 'VIEWER';
    return temp.toLowerCase();
  }, [session?.groups]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    void logout?.({
      revokeAccessToken: true,
      revokeRefreshToken: true,
      clearTokensBeforeRedirect: true
    });
    void navigate(PATHS.callBackLoading, {
      replace: true
    });
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={
          <Avatar sx={{width: '20px', height: '20px', '&:hover': {backgroundColor: 'inherit'}}}>
            <UserIcon className="w-5 h-5" />
          </Avatar>
        }
        variant="tertariary"
        sx={{
          paddingLeft: '4px',
          paddingRight: 0,
          '&.MuiButton-tertariary': {
            gap: '8px',
            '&:focus': {
              border: 'none !important'
            },
            '& .MuiButton-endIcon': {
              marginBottom: '14px'
            },
            ...(isMobile && {
              minWidth: 'unset',
              padding: 0,
              '& .MuiButton-startIcon': {
                margin: 0
              }
            })
          }
        }}
        endIcon={
          isMobile ? null : open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />
        }
        disableRipple
        disableFocusRipple
        focusRipple={false}
      >
        <div className="text-left hidden md:block">
          <Typography variant="subtitle2" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
            <span className="capitalize">{authInfo?.user?.name || 'User'}</span>
          </Typography>
          <div className="-mt-[3px]">
            <Typography
              textAlign="left"
              variant="caption"
              sx={(theme) => ({
                color: theme.palette.vars.baseTextStrong,
                textTransform: 'capitalize'
              })}
            >
              {role}
            </Typography>
          </div>
        </div>
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <div className="min-w-[220px] my-2 space-y-2 mb-4">
          <div className="flex justify-center">
            <Avatar sx={{width: '20px', height: '20px', '&:hover': {backgroundColor: 'inherit'}}}>
              <UserIcon className="w-5 h-5" />
            </Avatar>
          </div>
          <div className="text-center">
            <Typography variant="subtitle2" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
              <span className="capitalize">{authInfo?.user?.name || 'User'}</span>
            </Typography>
            <div className="-mt-[4px]">
              <Typography
                variant="caption"
                sx={(theme) => ({
                  color: theme.palette.vars.baseTextStrong,
                  textTransform: 'capitalize'
                })}
              >
                {role}
              </Typography>
            </div>
          </div>
        </div>
        <Divider />
        <MenuItem
          disableRipple
          onClick={() => {
            handleNotificationsChange(true);
            handleClose();
          }}
        >
          <div className="flex items-center justify-between w-full">
            <Typography variant="body2Semibold">Notifications</Typography>
            <BellIcon className="w-4 h-4" />
          </div>
        </MenuItem>
        <MenuItem disableRipple onClick={handleLogout}>
          <div className="flex items-center justify-between w-full">
            <Typography variant="body2Semibold">Logout</Typography>
            <LogOutIcon className="w-4 h-4" />
          </div>
        </MenuItem>
      </Menu>
    </>
  );
};
