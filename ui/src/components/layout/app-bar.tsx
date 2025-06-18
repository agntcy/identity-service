/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import useAuth from '@/providers/auth-provider/use-auth';
import {ChevronDownIcon, ChevronUpIcon, LogOutIcon} from 'lucide-react';
import {Avatar, Button, Divider, Header, Menu, MenuItem, Typography} from '@outshift/spark-design';
import Logo from '@/assets/logo-app-bar.svg';
import BookLogo from '@/assets/union.svg?react';
import GitLogo from '@/assets/git.svg?react';
import UserIcon from '@/assets/user.svg';

const UserSection = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const navigate = useNavigate();
  const {authInfo, logout} = useAuth();

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
        startIcon={<Avatar sx={{width: '20px', height: '20px'}} src={UserIcon} />}
        variant="tertariary"
        sx={{
          paddingLeft: '4px',
          '&.MuiButton-tertariary': {
            '&:focus': {
              border: 'none !important'
            }
          }
        }}
        endIcon={open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />}
        disableRipple
        disableFocusRipple
        focusRipple={false}
      >
        <Typography variant="subtitle2" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
          {authInfo?.user?.name || 'User'}
        </Typography>
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem>
          <Typography variant="caption">
            <b>Email:</b> {authInfo?.user?.username}
          </Typography>
        </MenuItem>
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

export const AppBar = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchValue, setSearchValue] = React.useState('');

  return (
    <Header
      title={
        <Typography variant="h1" fontWeight={700} fontSize="18px" lineHeight="18px" sx={(theme) => ({color: theme.palette.vars.brandTextSecondary})}>
          Identity
        </Typography>
      }
      logo={<img src={Logo} alt="Identity" />}
      position="fixed"
      searchProps={{
        onChangeCallback: (value: string) => {
          setSearchValue(value);
        }
      }}
      actions={[
        {
          id: 'docs',
          icon: <BookLogo />,
          tooltip: 'View Documentation',
          href: 'https://spec.identity.agntcy.org/',
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
