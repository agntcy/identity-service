/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode, useMemo, useState} from 'react';
import {IconButton, Tooltip, Typography, useTheme} from '@mui/material';
import {Link, useLocation} from 'react-router-dom';
import {cn} from '@/lib/utils';
import {PATHS} from '@/router/paths';
import {ChevronLeftIcon, ChevronRightIcon, LayoutDashboardIcon} from 'lucide-react';
import OrganizationLogo from '@/assets/organization.svg?react';
import {useAnalytics, useAuth} from '@/hooks';
import {OrganizationsDrawer} from './organizations-drawer';
import {OverflowTooltip, TooltipProps} from '@outshift/spark-design';
import SettingsIcon from '@/assets/sidebar/settings.svg?react';
import AgenticServicesLogo from '@/assets/sidebar/agentic-services.svg?react';
import PoliciesLogo from '@/assets/sidebar/access-policies.svg?react';
import VerifyIdentityLogo from '@/assets/sidebar/verify-identity.svg?react';
import '@/styles/side-nav.css';
import config from '@/config';

interface SideNavLinkItem {
  href: string;
  label: ReactNode;
  icon: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export const SideNav: React.FC<{
  isCollapsed?: boolean;
  onChangeCollapsed?: (value?: boolean) => void;
}> = ({isCollapsed, onChangeCollapsed}) => {
  const [isOrgOpen, setIsOrgOpen] = useState(false);

  const theme = useTheme();
  const {authInfo} = useAuth();
  const {analyticsTrack} = useAnalytics();

  const sideNavLinks: SideNavLinkItem[] = useMemo(() => {
    const temp: SideNavLinkItem[] = [
      {
        href: PATHS.dashboard,
        label: 'Dashboard',
        icon: <LayoutDashboardIcon className="w-4 h-4" />,
        onClick: () => {
          analyticsTrack('CLICK_NAVIGATION_DASHBOARD');
        }
      },
      {
        href: PATHS.agenticServices.base,
        label: 'Agentic Services',
        icon: <AgenticServicesLogo className="w-4 h-4" />,
        onClick: () => {
          analyticsTrack('CLICK_NAVIGATION_AGENTIC_SERVICES');
        }
      },
      {
        href: PATHS.verifyIdentity.base,
        label: 'Verify Identity',
        icon: <VerifyIdentityLogo className="w-4 h-4" />,
        onClick: () => {
          analyticsTrack('CLICK_NAVIGATION_VERIFY_IDENTITY');
        }
      },
      {
        href: PATHS.policies.base,
        label: 'Policies',
        icon: <PoliciesLogo className="w-4 h-4" />,
        onClick: () => {
          analyticsTrack('CLICK_NAVIGATION_POLICIES');
        }
      },
      {
        href: PATHS.settings.base,
        label: 'Settings',
        icon: <SettingsIcon className="w-4 h-4" />,
        onClick: () => {
          analyticsTrack('CLICK_NAVIGATION_SETTINGS');
        }
      }
    ];
    return temp.filter((link) => !link.disabled);
  }, [analyticsTrack]);

  const location = useLocation();
  const currentPathName = location.pathname;

  const active = sideNavLinks.find((link) => {
    return currentPathName.startsWith(link.href);
  });

  return (
    <>
      <nav
        style={{zIndex: 20, position: 'relative'}}
        className="flex relative flex-col justify-between gap-1 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2 bg-[#EFF3FC] h-full side-bar pl-4"
      >
        <div>
          {config.IAM_MULTI_TENANT && (
            <div className={cn('pr-4', isCollapsed && 'pr-4', isOrgOpen && 'pr-0')}>
              <SideNavLink
                label={
                  <OverflowTooltip
                    value={authInfo?.user?.tenant?.name}
                    someLongText={authInfo?.user?.tenant?.name}
                    styleText={{
                      color: theme.palette.vars.brandTextSecondary,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  />
                }
                isLink={false}
                icon={<OrganizationLogo className="w-5 h-5" />}
                className={cn(
                  'border-1 border-[#D5DFF7] border-solid h-[56px] rounded-[8px] flex items-center gap-4 mt-8',
                  isOrgOpen && 'bg-[#E8F1FF] custom-border-org'
                )}
                classNameIcon={cn(
                  '[&>svg]:min-w-7 [&>svg]:min-h-7 [&>svg]:max-w-7 [&>svg]:max-h-7',
                  isOrgOpen && isCollapsed && 'pr-4'
                )}
                isCollapsed={isCollapsed}
                actionIcon={isOrgOpen || isCollapsed ? null : <ChevronRightIcon className="ml-auto w-4 h-4" />}
                onClick={() => {
                  setIsOrgOpen(!isOrgOpen);
                }}
              />
            </div>
          )}
          <div className={cn('flex flex-col gap-1 mt-8 pr-4', isCollapsed && 'pr-4')}>
            {sideNavLinks.map((link) => {
              return (
                <SideNavLink
                  {...link}
                  isCollapsed={isCollapsed}
                  key={`side-nav-link-${link.href}`}
                  isActive={active?.href === link.href}
                />
              );
            })}
          </div>
        </div>
        <div className={cn('absolute bottom-[200px] left-[24px]')}>
          <IconButton
            onClick={() => onChangeCollapsed?.(!isCollapsed)}
            sx={{
              backgroundColor: '#FBFCFE',
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #FBAB2C'
            }}
          >
            <ChevronLeftIcon className={cn('!w-4 !h-4 stroke-[#00142B]', isCollapsed && 'rotate-180')} />
          </IconButton>
        </div>
      </nav>
      {config.IAM_MULTI_TENANT && (
        <OrganizationsDrawer isOpen={isOrgOpen} onChange={(value) => setIsOrgOpen(value)} isCollapsed={isCollapsed} />
      )}
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
  classNameIcon?: string;
  actionIcon?: ReactNode;
  onClick?: () => void;
}> = ({
  label,
  href,
  icon,
  isActive,
  isCollapsed,
  isLink = true,
  description,
  className,
  actionIcon,
  classNameIcon,
  isExternal,
  onClick
}) => {
  const ThisLink = (
    <div
      className={cn(
        'flex items-center p-[8px] h-[40px] gap-4 overflow-hidden w-full rounded-[8px] transition-colors cursor-pointer',
        'hover:bg-[#E8F1FF] hover:text-[#00142B]',
        isActive && 'bg-[#E8F1FF]',
        isCollapsed && 'justify-center',
        !isCollapsed && 'pl-4',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'object-cover flex-shrink-0 flex-grow-0 [&>svg]:transition-all [&>svg]:text-[#59616B]',
          isCollapsed
            ? '[&>svg]:min-w-5 [&>svg]:min-h-6 [&>svg]:max-w-6 [&>svg]:max-h-6'
            : '[&>svg]:min-w-5 [&>svg]:min-h-5 [&>svg]:max-w-5 [&>svg]:max-h-5',
          isActive && '[&>svg]:text-[#187ADC]',
          classNameIcon
        )}
      >
        {icon}
      </div>
      {!isCollapsed && (
        <Typography
          noWrap
          textAlign="left"
          variant="captionMedium"
          sx={(theme) => ({
            color: isActive ? theme.palette.vars.brandTextPrimary : theme.palette.vars.brandTextSecondary
          })}
        >
          {label}
        </Typography>
      )}
      {actionIcon && <div className="ml-auto flex-shrink-0">{actionIcon}</div>}
    </div>
  );

  const Wrapper = isLink ? (
    <Link
      to={href ? href : '#'}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {ThisLink}
    </Link>
  ) : (
    ThisLink
  );

  if (isCollapsed) {
    return (
      <SideNavTooltip title={label} description={description}>
        {Wrapper}
      </SideNavTooltip>
    );
  }

  return Wrapper;
};

const SideNavTooltip: React.FC<
  {
    title: ReactNode;
    description?: ReactNode;
  } & TooltipProps
> = ({title, description, children}) => {
  return (
    <Tooltip
      title={
        <div className="flex flex-col gap-1 p-1">
          <Typography variant="captionMedium">{title}</Typography>
          {description && <Typography variant="body2">{description}</Typography>}
        </div>
      }
      placement="right"
      arrow
    >
      {children}
    </Tooltip>
  );
};
