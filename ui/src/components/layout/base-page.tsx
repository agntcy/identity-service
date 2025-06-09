/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ReactNode} from 'react';
import React from 'react';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import Breadcrumbs, {BreadcrumbsProps} from '@/components/ui/breadcrumbs';
import {Link} from 'react-router-dom';
import {cn} from '@/lib/utils';

export const BasePage: React.FC<BasePageProps> = ({
  children,
  breadcrumbs,
  parentTitle,
  title,
  description,
  rightSideItems,
  subNav,
  useBreadcrumbs = true
}) => {
  const hideHeader = !title && !description && !rightSideItems;
  const showHeader = !hideHeader;

  return (
    <>
      {useBreadcrumbs ? (
        <div className="flex justify-between px-5 pb-3 pt-5 items-center max-w-screen overflow-hidden">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      ) : null}
      <div>
        {showHeader && (
          <div className={cn('flex items-center justify-between gap-2 flex-wrap mx-5 pb-2 mb-2', !useBreadcrumbs && 'mt-6', subNav && 'mb-0 pb-0')}>
            <div className={cn('flex items-center justify-between w-full flex-wrap pb-2 gap-2', !subNav && ' border-b')}>
              <div>
                <h1 className="text-[24px] flex items-center gap-2 mb-1 font-semibold text-[#00142B]">{parentTitle || title}</h1>
                <div className="text-[#3C4551] text-[14px] min-h-4">{description}</div>
              </div>
              {rightSideItems && <div className="flex items-center gap-2">{rightSideItems}</div>}
            </div>
          </div>
        )}
        <div className="md:px-5 py-2 bg-background">
          {subNav && (
            <Tabs
              className="-mt-2 mb-4"
              value={
                subNav.find((item) => {
                  return window.location.pathname === item.href;
                })?.href || subNav[0].href
              }
            >
              <TabsList className="w-full">
                {subNav.map((item) => (
                  <Link to={item.href} key={`subNavItem-${item.href}`}>
                    <TabsTrigger value={item.href} className="hover:cursor-pointer">
                      {item.label}
                    </TabsTrigger>
                  </Link>
                ))}
              </TabsList>
            </Tabs>
          )}
          {children}
        </div>
      </div>
    </>
  );
};

interface BasePageProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbsProps['breadcrumbs'];
  parentTitle?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  rightSideItems?: ReactNode;
  subNav?: {href: string; label: ReactNode; active?: boolean}[];
  useBreadcrumbs?: boolean;
}
