/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {ReactNode} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Tooltip, TooltipContent, TooltipTrigger} from '../ui/tooltip';
import {Button} from '../ui/button';
import {TooltipArrow} from '@radix-ui/react-tooltip';
import Logo from '@/assets/logo-app-bar.svg';
import UnionLogo from '@/assets/union.svg?react';
import GitLogo from '@/assets/git.svg?react';
import {PATHS} from '@/router/paths';
import {Separator} from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import useAuth from '@/providers/auth-provider/use-auth';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import UserIcon from '@/assets/user.svg';
import '@/styles/app-bar.css';
import {ChevronDownIcon, LogOutIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import MaxWHover from '../ui/max-w-hover';

export const AppBar: React.FC = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const {authInfo, logout} = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    void logout?.({
      revokeAccessToken: true,
      revokeRefreshToken: true,
      clearTokensBeforeRedirect: true
    });
    void navigate(`${PATHS.callBackLoading}`);
  };

  const items: {
    element: ReactNode;
    show: boolean;
  }[] = [
    {
      element: (
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer group">
          <p>Logout</p>
          <DropdownMenuShortcut className="invisible group-hover:visible">
            <LogOutIcon className="w-4 h-4" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      ),
      show: true
    }
  ];

  return (
    <header className="flex justify-between px-8 py-2 items-center max-w-screen overflow-hidden border-b sticky top-0 z-40 app-bar h-[56px]">
      <div>
        <Link to={PATHS.basePath} className="flex gap-3 items-center">
          <img src={Logo} alt="Identity" />
          <p className="product-name">Identity</p>
        </Link>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={'https://spec.identity.agntcy.org/'} target="_blank">
              <Button variant={'link'} size="icon">
                <UnionLogo className="w-6 h-6" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <TooltipArrow />
            Documentation
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={'https://github.com/agntcy/identity'} target="_blank">
              <Button variant={'link'} size="icon">
                <GitLogo className="w-6 h-6" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <TooltipArrow />
            GitHub
          </TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="min-h-[30px] w-[1px] bg-[#D5DFF7]" />
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger>
            <Button variant="link" className="flex gap-3 items-top hover:no-underline" style={{padding: '0px'}}>
              <Avatar className="h-[18px] w-[18px]">
                <AvatarImage src={UserIcon} />
                <AvatarFallback>{authInfo?.user?.username?.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="text-left no-underline">
                <div className="flex items-center gap-2">
                  <p className="app-bar-name">{authInfo?.user?.name}</p>
                  <ChevronDownIcon className={cn('w-3 h-3 stroke-[#187ADC]', menuOpen && 'rotate-180')} />
                </div>
                <p className="app-bar-desc">
                  {authInfo?.user?.tenant?.name && authInfo?.user?.tenant?.name.length > 15
                    ? `${authInfo?.user?.tenant?.name.substring(0, 15)}...`
                    : authInfo?.user?.tenant?.name}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 rounded-md shadow-md">
            <DropdownMenuLabel className="menu-label">User Information</DropdownMenuLabel>
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="text-xs">
                <b>Email:</b> {authInfo?.user?.username}
              </span>
              <MaxWHover className="text-xs text-left">
                <b>Tenant:</b> {authInfo?.user?.tenant?.name}
              </MaxWHover>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {items.map((item, i) => {
                return <React.Fragment key={`dropdown-${i}`}>{item.show ? item.element : null}</React.Fragment>;
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
