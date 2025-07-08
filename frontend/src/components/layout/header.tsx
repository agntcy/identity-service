/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {ChevronDownIcon, ChevronUpIcon, LogOutIcon} from 'lucide-react';
import {Avatar, Button, Divider, Header as SparkHeader, Menu, MenuItem, Typography} from '@outshift/spark-design';
import Logo from '@/assets/logo-app-bar.svg';
import BookLogo from '@/assets/union.svg?react';
import GitLogo from '@/assets/git.svg?react';
import UserIcon from '@/assets/user.svg';
import {Link} from 'react-router-dom';
import {useAuth} from '@/hooks';
import {docs} from '@/utils/docs';
import {useSettingsStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';

export const Header = () => {
  return (
    <SparkHeader
      title={
        <Typography variant="h1" fontWeight={700} fontSize="18px" lineHeight="18px" sx={(theme) => ({color: theme.palette.vars.brandTextSecondary})}>
          Agent Identity
        </Typography>
      }
      logo={
        <Link to={PATHS.dashboard}>
          <img src={Logo} alt="Identity" />
        </Link>
      }
      position="fixed"
      actions={[
        {
          id: 'docs',
          icon: <BookLogo />,
          tooltip: 'View Documentation',
          href: docs(),
          'aria-label': 'documentation',
          target: '_blank'
        },
        {
          id: 'github',
          icon: <GitLogo />,
          tooltip: 'View GitHub',
          href: 'https://github.com/agntcy/identity',
          'aria-label': 'github',
          target: '_blank'
        }
      ]}
      userSection={<UserSection />}
    />
  );
};

const UserSection = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
    void navigate(`${PATHS.callBackLoading}`);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<Avatar sx={{width: '20px', height: '20px', '&:hover': {backgroundColor: 'inherit'}}} src={UserIcon} />}
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
              marginBottom: '20px'
            }
          }
        }}
        endIcon={open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />}
        disableRipple
        disableFocusRipple
        focusRipple={false}
      >
        <div className="text-left">
          <Typography variant="subtitle2" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
            <span className="capitalize">{authInfo?.user?.name || 'User'}</span>
          </Typography>
          <div className="-mt-[3px]">
            <Typography textAlign="left" variant="caption" sx={(theme) => ({color: theme.palette.vars.baseTextStrong, textTransform: 'capitalize'})}>
              {role}
            </Typography>
          </div>
        </div>
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <div className="min-w-[220px] my-2 space-y-2 mb-4">
          <div className="flex justify-center">
            <Avatar sx={{width: '20px', height: '20px', '&:hover': {backgroundColor: 'inherit'}}} src={UserIcon} />
          </div>
          <div className="text-center">
            <Typography variant="subtitle2" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
              <span className="capitalize">{authInfo?.user?.name || 'User'}</span>
            </Typography>
            <div className="-mt-[4px]">
              <Typography variant="caption" sx={(theme) => ({color: theme.palette.vars.baseTextStrong, textTransform: 'capitalize'})}>
                {role}
              </Typography>
            </div>
          </div>
        </div>
        <Divider />
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
