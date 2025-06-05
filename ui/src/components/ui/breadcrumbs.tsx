/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {cn} from '@/lib/utils';
import {PATHS} from '@/router/paths';
import {ChevronRightIcon, HomeIcon} from '@radix-ui/react-icons';
import {ReactNode} from 'react';
import {Link} from 'react-router-dom';

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({breadcrumbs}) => {
  const defaultBreadcrumbs: BreadcrumbsProps['breadcrumbs'] = [
    {
      text: (
        <div className="min-w-[1rem]">
          <HomeIcon />
        </div>
      ),
      href: PATHS.basePath
    }
  ];

  if (breadcrumbs === undefined) {
    breadcrumbs = defaultBreadcrumbs;
  } else {
    breadcrumbs = [...defaultBreadcrumbs, ...breadcrumbs];
  }

  return (
    <div className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden overflow-ellipsis flex-shrink-1 min-w-[10rem]">
      {breadcrumbs?.map((breadcrumb, index) => {
        return (
          <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden overflow-ellipsis" key={`breadcrumb-${index}-${breadcrumb.href}`}>
            {breadcrumb.href === undefined ? (
              <span className="font-medium text-[#00142B] whitespace-nowrap overflow-hidden overflow-ellipsis">{breadcrumb.text}</span>
            ) : (
              <Link
                to={breadcrumb.href}
                className={cn(
                  'font-medium hover:text-primary-light text-primary hover:underline whitespace-nowrap overflow-hidden overflow-ellipsis',
                  index === (breadcrumbs?.length || 0) - 1 && 'text-[#0051AF]'
                )}
              >
                {breadcrumb.text}
              </Link>
            )}
            {index !== (breadcrumbs?.length || 0) - 1 && <ChevronRightIcon className="w-3 h-3 text-[#0051AF]" />}
          </div>
        );
      })}
    </div>
  );
};

export interface BreadcrumbsProps {
  breadcrumbs?: {href?: string | undefined; text: ReactNode}[];
}

export default Breadcrumbs;
