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
    <div className="flex items-center gap-2 text-[14px] whitespace-nowrap overflow-hidden overflow-ellipsis flex-shrink-1 min-w-[10rem]">
      {breadcrumbs?.map((breadcrumb, index) => {
        return (
          <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden overflow-ellipsis" key={`breadcrumb-${index}-${breadcrumb.href}`}>
            {breadcrumb.href === undefined ? (
              <span className="text-[#00142B] font-semibold whitespace-nowrap overflow-hidden overflow-ellipsis">{breadcrumb.text}</span>
            ) : (
              <Link
                to={breadcrumb.href}
                className={cn(
                  'font-medium hover:[#263B62] text-[#062242] hover:underline whitespace-nowrap overflow-hidden overflow-ellipsis',
                  index === (breadcrumbs?.length || 0) - 1 && 'text-[#263B62]'
                )}
              >
                {breadcrumb.text}
              </Link>
            )}
            {index !== (breadcrumbs?.length || 0) - 1 && <ChevronRightIcon className="w-3 h-3 text-[#263B62] stroke-[#263B62]" />}
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
