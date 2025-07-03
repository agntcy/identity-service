/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Sheet, SheetContent, SheetHeader, SheetTitle} from '../ui/sheet';
import {Button, Divider, OverflowTooltip, toast, Typography} from '@outshift/spark-design';
import {cn} from '@/lib/utils';
import {useGetTenants} from '@/queries';
import {LoaderRelative} from '../ui/loading';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useAuth} from '@/hooks';
import {ConfirmModal} from '../ui/confirm-modal';
import {PlusIcon} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PATHS} from '@/router/paths';

export const OrganizationsDrawer: React.FC<{
  isOpen: boolean;
  isCollapsed?: boolean;
  onChange: (value: boolean) => void;
}> = ({isOpen, isCollapsed, onChange}) => {
  const [tenant, setTenant] = useState<undefined | {id: string; name: string}>();
  const openConfirmation = Boolean(tenant?.id);

  const {authInfo, switchTenant} = useAuth();

  const {data, isLoading, isError} = useGetTenants();

  const handleConfirmationChange = useCallback(
    (value?: {id: string; name: string}) => {
      setTenant(value);
      if (value) {
        onChange(false);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (isError) {
      toast({
        title: 'Error',
        description: 'Failed to load organizations.',
        type: 'error'
      });
    }
  }, [isError]);

  const sortedTenants = useMemo(() => data?.tenants.sort((a, b) => a.name.localeCompare(b.name)), [data?.tenants]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onChange}>
        <SheetContent
          usePortal={false}
          side="left"
          className={cn(
            'left-[264px] top-[56px] bg-[#E8F1FF] w-[224px] organization-drawer data-[state=closed]:slide-out-to-left-custom data-[state=open]:slide-in-from-left-custom',
            isCollapsed && 'left-[88px]'
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
            <div className="flex flex-col gap-4 px-4">
              <Link to={PATHS.settings.organizationsAndUsers.create}>
                <Button
                  variant="outlined"
                  endIcon={<PlusIcon className="w-4 h-4" />}
                  fullWidth
                  sx={{
                    fontWeight: '600 !important',
                    '&.MuiButton-outlined': {
                      '&:focus': {
                        outline: 'none !important'
                      }
                    }
                  }}
                >
                  New Organization
                </Button>
              </Link>
              <div className="flex flex-col gap-2 overflow-y-auto">
                {sortedTenants?.map((tenant) => (
                  <div
                    key={tenant.id}
                    className={cn(
                      'justify-start text-left w-full hover:bg-[#9BCAFF] p-[8px] rounded-[8px] hover:cursor-pointer',
                      tenant.id === authInfo?.user?.tenant?.id ? 'bg-[#9BCAFF]' : 'bg-transparent'
                    )}
                    onClick={() => {
                      handleConfirmationChange(tenant);
                    }}
                  >
                    <Typography variant="captionMedium" sx={{color: tenant.id === authInfo?.user?.tenant?.id ? '#0051AF' : '#00142B'}}>
                      <OverflowTooltip value={tenant.name} someLongText={tenant.name} placement="right" />
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <ConfirmModal
        open={openConfirmation}
        title="Change organization"
        description={
          <>
            This will log you out of your current organization so that you can log into <b>{tenant?.name}</b>. Do you still want to continue?
          </>
        }
        confirmButtonText="Continue"
        onCancel={() => handleConfirmationChange(undefined)}
        onConfirm={() => {
          if (tenant?.id) {
            switchTenant?.(tenant.id);
          }
        }}
        buttonConfirmProps={{
          color: 'default'
        }}
      />
    </>
  );
};
