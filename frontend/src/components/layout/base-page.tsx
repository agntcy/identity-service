/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Breadcrumbs, BreadcrumbsProps, Tab, Tabs, TabsProps} from '@outshift/spark-design';
import ScrollShadowWrapper from '../ui/scroll-shadow-wrapper';
import {Box, BoxProps, Typography} from '@mui/material';
import {ReactNode, useCallback, useEffect} from 'react';
import {TabProps as MuiTabProps} from '@mui/material';
import React from 'react';
import {Link} from 'react-router-dom';

type SubNavItem = MuiTabProps & {href?: string; selected?: boolean};

export interface BasePageProps {
  children: ReactNode;
  containerProps?: BoxProps;
  breadcrumbs?: BreadcrumbsProps['items'];
  title: ReactNode;
  description?: ReactNode;
  rightSideItems?: ReactNode;
  tabsProps?: TabsProps;
  subNav?: SubNavItem[];
  useBreadcrumbs?: boolean;
  useBorder?: boolean;
  initialTab?: number;
}

export const BasePage = ({
  children,
  containerProps,
  breadcrumbs,
  title,
  description,
  rightSideItems,
  subNav,
  tabsProps,
  useBorder = false,
  useBreadcrumbs = true
}: BasePageProps) => {
  const [tab, setTab] = React.useState<number | undefined>(undefined);
  const hideHeader = !title && !description && !rightSideItems;
  const showHeader = !hideHeader;
  const showBorder = useBorder && (subNav || showHeader);

  const handleChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  }, []);

  useEffect(() => {
    if (subNav) {
      const currentPath = window.location.pathname;

      // First try to find exact match
      let currentTab = subNav.findIndex((item) => item.href === currentPath);

      // If no exact match, try to find partial match
      if (currentTab === -1) {
        currentTab = subNav.findIndex((item) => item.href && currentPath.includes(item.href));
      }

      // If still no match, try reverse match (href contains current path)
      if (currentTab === -1) {
        currentTab = subNav.findIndex((item) => item.href && item.href.includes(currentPath));
      }

      // Set the tab if a match is found, otherwise default to 0
      setTab(currentTab !== -1 ? currentTab : 0);
    }
  }, [subNav]);

  return (
    <ScrollShadowWrapper>
      <Box
        flexDirection="column"
        display="flex"
        flexGrow={1}
        width="100%"
        height="100%"
        maxWidth="100%"
        maxHeight="100%"
        gap={'24px'}
        sx={{
          padding: '24px 32px 48px 32px',
          overflow: 'hidden scroll',
          ...containerProps?.sx
        }}
        {...containerProps}
      >
        {useBreadcrumbs && breadcrumbs && (
          <Box display="flex" justifyContent="space-between" alignItems="center" maxWidth="100%" overflow="hidden">
            <Breadcrumbs sx={{marginBottom: 0}} items={breadcrumbs} />
          </Box>
        )}
        <Box>
          {showHeader && (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              pb={showBorder ? 2 : 0}
              borderBottom={showBorder ? 1 : 0}
              borderColor="divider"
            >
              <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="start">
                <Box display="flex" flexDirection="column" gap="8px" flexGrow={1}>
                  <Typography
                    variant="h5"
                    component="h1"
                    fontWeight="bold"
                    sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}
                  >
                    {title}
                  </Typography>
                  {description && <Typography variant="body2">{description}</Typography>}
                </Box>
                {rightSideItems && (
                  <Box display="flex" gap="8px" flexWrap="wrap">
                    {rightSideItems}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
        {subNav && tab !== undefined && (
          <Box
            display="flex"
            justifyContent="space-between"
            flexDirection="column"
            flexWrap="wrap"
            maxWidth="100%"
            flexGrow={1}
            height="auto"
          >
            <Tabs value={tab} onChange={handleChange} role="navigation" {...tabsProps}>
              {subNav.map((item, idx) => {
                return (
                  <Tab
                    key={`item-tab-${idx}`}
                    component={Link}
                    aria-current={item.selected && 'page'}
                    {...item}
                    to={item.href || '#'}
                  />
                );
              })}
            </Tabs>
          </Box>
        )}
        <Box width="100%" height="100%" marginTop="8px" marginBottom="16px">
          {children}
        </Box>
      </Box>
    </ScrollShadowWrapper>
  );
};
