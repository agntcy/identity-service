/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode, useMemo, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {cn} from '@/lib/utils';
import {PATHS} from '@/router/paths';
import {Button} from '../ui/button';
import {BoxesIcon, ChevronLeftIcon, ChevronRightIcon, LayoutDashboardIcon, SlidersHorizontalIcon} from 'lucide-react';
import OrganizationLogo from '@/assets/organization.svg?react';
import {useAuth} from '@/hooks';
import {OrganizationsDrawer} from './organizations-drawer';
import {OverflowTooltip} from '@outshift/spark-design';
import '@/styles/side-nav.css';

export const SideNav: React.FC<{isCollapsed?: boolean; onChangeCollapsed?: (value?: boolean) => void}> = ({isCollapsed, onChangeCollapsed}) => {
  const [isOrgOpen, setIsOrgOpen] = useState(false);

  const {authInfo} = useAuth();

  const sideNavLinks: {
    href: string;
    label: ReactNode;
    icon: ReactNode;
    description?: ReactNode;
    onClick?: () => void;
  }[] = useMemo(() => {
    return [
      {
        href: PATHS.dashboard,
        label: 'Dahboard',
        icon: <LayoutDashboardIcon className="w-4 h-4" />
      },
      {
        href: PATHS.applications,
        label: 'Applications',
        icon: <BoxesIcon className="w-4 h-4" />
      },
      {
        href: PATHS.settings,
        label: 'Settings',
        icon: <SlidersHorizontalIcon className="w-4 h-4" />
      }
    ];
  }, []);

  const location = useLocation();
  const currentPathName = location.pathname;

  const active = sideNavLinks.find((link) => {
    return currentPathName.startsWith(link.href);
  });

  return (
    <>
      <nav
        style={{zIndex: 20, position: 'relative'}}
        className="flex relative flex-col justify-between gap-1 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2 bg-side-nav-background h-full text-white side-bar mt-[56px]"
      >
        <div>
          <div className={cn('pr-4', isCollapsed && 'pr-2', isOrgOpen && 'pr-0')}>
            <SideNavLink
              label={<OverflowTooltip value={authInfo?.user?.tenant?.name} someLongText={authInfo?.user?.tenant?.name} />}
              isLink={false}
              icon={<OrganizationLogo className="w-4 h-4" />}
              className={cn(
                'border-1 border-[#D5DFF7] border-solid h-[56px] rounded-[8px] flex items-center gap-4',
                isOrgOpen && 'bg-[#E8F1FF] custom-border-org'
              )}
              isCollapsed={isCollapsed}
              actionIcon={isOrgOpen ? null : <ChevronRightIcon className="ml-auto w-4 h-4" />}
              onClick={() => {
                setIsOrgOpen(!isOrgOpen);
              }}
            />
          </div>
          <div className={cn('flex flex-col gap-1 mt-8 pr-4', isCollapsed && 'pr-2')}>
            {sideNavLinks.map((link) => {
              return <SideNavLink {...link} isCollapsed={isCollapsed} key={`side-nav-link-${link.href}`} isActive={active?.href === link.href} />;
            })}
          </div>
        </div>
        <div className={cn('absolute bottom-34 left-[10px]')}>
          <Button variant="outline" className="collapse-button" onClick={() => onChangeCollapsed?.(!isCollapsed)} size="icon">
            <ChevronLeftIcon className={cn('!w-4 !h-4 stroke-[#00142B]', isCollapsed && 'rotate-180')} />
          </Button>
        </div>
      </nav>
      <OrganizationsDrawer isOpen={isOrgOpen} onChange={(value) => setIsOrgOpen(value)} isCollapsed={isCollapsed} />
    </>
  );
};

const SideNavLink: React.FC<{
  label: ReactNode;
  href?: string;
  icon: ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
  isExternal?: boolean;
  description?: ReactNode;
  isLink?: boolean;
  className?: string;
  actionIcon?: ReactNode;
  onClick?: () => void;
}> = ({label, href, icon, isActive, isCollapsed, isLink = true, description, className, actionIcon, isExternal, onClick}) => {
  let ThisLink = (
    <Link to={href ? href : '#'} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
      <button
        className={cn(
          'flex items-center px-3 py-3 gap-4 hover:bg-side-nav-hover w-full rounded-md text-[#00142B] overflow-hidden text-sm cursor-pointer font-medium transition-colors hover:text-[#0051AF]',
          isActive && 'bg-[#DEE6F9] hover:bg-[#DEE6F9]',
          isCollapsed && 'justify-center',
          !isCollapsed && 'pl-4',
          className
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            'object-cover flex-shrink-0 flex-grow-0 [&>svg]:transition-all',
            isCollapsed
              ? '[&>svg]:min-w-5 [&>svg]:min-h-6 [&>svg]:max-w-6 [&>svg]:max-h-6 stroke-[1.4]'
              : '[&>svg]:min-w-5 [&>svg]:min-h-5 [&>svg]:max-w-5 [&>svg]:max-h-5 stroke-[1.4]',
            isActive && '[&>svg]:text-[#002786]'
          )}
        >
          {icon}
        </div>
        {!isCollapsed && (
          <span
            className={cn(
              'text-[#1A1F27] text-left whitespace-nowrap overflow-ellipsis overflow-hidden text-[0.9rem] font-semibold',
              isActive && 'text-[#002786]'
            )}
          >
            {label}
          </span>
        )}
      </button>
    </Link>
  );

  if (!isLink) {
    ThisLink = (
      <button
        className={cn(
          'flex items-center px-3 py-3 gap-4 hover:bg-side-nav-hover w-full rounded-md text-[#00142B] overflow-hidden text-sm cursor-pointer font-medium transition-colors hover:text-[#0051AF]',
          isActive && 'bg-[#DEE6F9] hover:bg-[#DEE6F9]',
          isCollapsed && 'justify-center',
          !isCollapsed && 'pl-4',
          className
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            'object-cover flex-shrink-0 flex-grow-0 [&>svg]:transition-all',
            isCollapsed
              ? '[&>svg]:min-w-5 [&>svg]:min-h-6 [&>svg]:max-w-6 [&>svg]:max-h-6 stroke-[1.4]'
              : '[&>svg]:min-w-5 [&>svg]:min-h-5 [&>svg]:max-w-5 [&>svg]:max-h-5 stroke-[1.4]',
            isActive && '[&>svg]:text-[#002786]'
          )}
        >
          {icon}
        </div>
        {!isCollapsed && (
          <span
            className={cn(
              'text-[#1A1F27] text-left whitespace-nowrap overflow-ellipsis overflow-hidden text-[0.9rem] font-semibold',
              isActive && 'text-[#002786]'
            )}
          >
            {label}
          </span>
        )}
        {!isCollapsed && actionIcon && actionIcon}
      </button>
    );
  }

  return isCollapsed ? (
    <SideNavTooltip label={label} description={description}>
      {ThisLink}
    </SideNavTooltip>
  ) : (
    ThisLink
  );
};

const SideNavTooltip: React.FC<{
  children: ReactNode;
  label: ReactNode;
  description?: ReactNode;
}> = ({children, label, description}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="font-semibold" align="start">
        <div className="flex flex-col gap-1 p-1 text-sm">
          <div className="font-semibold">{label}</div>
          {description && <div className="text-muted-foreground font-normal">{description}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
