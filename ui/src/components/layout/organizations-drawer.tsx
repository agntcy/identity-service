/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Sheet, SheetContent, SheetHeader, SheetTitle} from '../ui/sheet';
import {Divider, OverflowTooltip, toast, Typography} from '@outshift/spark-design';
import {cn} from '@/lib/utils';
import {useGetTenants} from '@/queries';
import {LoaderRelative} from '../ui/loading';
import {useEffect} from 'react';
import {useAuth} from '@/hooks';

export const OrganizationsDrawer: React.FC<{
  isOpen: boolean;
  isCollapsed?: boolean;
  onChange: (value: boolean) => void;
}> = ({isOpen, isCollapsed, onChange}) => {
  const {authInfo, switchTenant} = useAuth();

  const {data, isLoading, isError} = useGetTenants();

  useEffect(() => {
    if (isError) {
      toast({
        title: 'Error',
        description: 'Failed to load organizations.',
        type: 'error'
      });
    }
  }, [isError]);

  return (
    <Sheet open={isOpen} onOpenChange={onChange}>
      <SheetContent
        usePortal={false}
        side="left"
        className={cn(
          'left-[264px] top-[56px] bg-[#E8F1FF] w-[224px] organization-drawer data-[state=closed]:slide-out-to-left-custom data-[state=open]:slide-in-from-left-custom',
          isCollapsed && 'left-[54px]'
        )}
        useOverlay={false}
      >
        <SheetHeader>
          <SheetTitle>Organizations</SheetTitle>
        </SheetHeader>
        <Divider sx={{marginTop: '-16px'}} />
        {isLoading ? (
          <LoaderRelative />
        ) : (
          <div className="flex flex-col gap-2 px-4">
            {data?.tenants.map((tenant) => (
              <div
                key={tenant.id}
                className={cn(
                  'justify-start text-left w-full hover:bg-[#9BCAFF] p-[8px] rounded-[8px] hover:cursor-pointer',
                  tenant.id === authInfo?.user?.tenant?.id ? 'bg-[#9BCAFF]' : 'bg-transparent'
                )}
                onClick={() => {
                  switchTenant?.(tenant.id);
                }}
              >
                <Typography variant="captionMedium" sx={{color: tenant.id === authInfo?.user?.tenant?.id ? '#0051AF' : '#00142B'}}>
                  <OverflowTooltip value={tenant.name} someLongText={tenant.name} />
                </Typography>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
