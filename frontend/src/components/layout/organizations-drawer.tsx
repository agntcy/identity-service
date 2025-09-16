/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* c8 ignore start */

import {Sheet, SheetContent, SheetHeader, SheetTitle} from '../ui/sheet';
import {Button, Divider, OverflowTooltip, toast, Typography} from '@outshift/spark-design';
import {cn} from '@/lib/utils';
import {useGetTenants} from '@/queries';
import {LoaderRelative} from '../ui/loading';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useAnalytics, useAuth} from '@/hooks';
import {ConfirmModal} from '../ui/confirm-modal';
import {PlusIcon} from 'lucide-react';
import {useCreateTenant} from '@/mutations';
import {useBanner} from '@/providers/banner-provider/banner-provider';

export const OrganizationsDrawer: React.FC<{
  isOpen: boolean;
  isCollapsed?: boolean;
  onChange: (value: boolean) => void;
}> = ({isOpen, isCollapsed, onChange}) => {
  const [tenant, setTenant] = useState<undefined | {id: string; name: string}>();
  const openConfirmation = Boolean(tenant?.id);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const {analyticsTrack} = useAnalytics();

  const {authInfo, switchTenant} = useAuth();

  const {data, isLoading, isError} = useGetTenants();

  const {hasBanners} = useBanner();

  const createOrganizationMutation = useCreateTenant({
    callbacks: {
      onSuccess: (resp) => {
        toast({
          title: 'Success',
          description: `Organization "${resp.data.name}" created successfully.`,
          type: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while creating the organization. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleCreateOrganization = useCallback(() => {
    analyticsTrack('CLICK_CONFIRM_NEW_ORGANIZATION');
    setOpenCreateModal(false);
    onChange(true);
    createOrganizationMutation.mutate();
  }, [analyticsTrack, createOrganizationMutation, onChange]);

  const handleConfirmationChange = useCallback(
    (value?: {id: string; name: string}) => {
      if (authInfo?.user?.tenant?.id === value?.id) {
        handleConfirmationChange(undefined);
        toast({
          title: 'Already in this organization',
          description: 'You are already logged into this organization.',
          type: 'info'
        });
      } else {
        if (value) {
          setTenant(value);
        }
        onChange(false);
      }
    },
    [authInfo?.user?.tenant?.id, onChange]
  );

  const handleSwitchTenant = useCallback(
    (tenantId: string) => {
      switchTenant?.(tenantId);
    },
    [switchTenant]
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
            isCollapsed && 'left-[88px]',
            hasBanners && 'top-[96px]'
          )}
          useOverlay={false}
        >
          <SheetHeader>
            <SheetTitle>Organizations</SheetTitle>
          </SheetHeader>
          <Divider sx={{marginTop: '-16px'}} />
          <div className="flex flex-col gap-4 px-4">
            <Button
              variant="outlined"
              startIcon={<PlusIcon className="w-4 h-4" />}
              fullWidth
              sx={{
                fontWeight: '600 !important',
                '&.MuiButton-outlined': {
                  '&:focus': {
                    outline: 'none !important'
                  }
                }
              }}
              onClick={() => {
                analyticsTrack('CLICK_NEW_ORGANIZATION');
                setOpenCreateModal(true);
                onChange(false);
              }}
              disabled={isLoading || createOrganizationMutation.isPending}
              loading={isLoading || createOrganizationMutation.isPending}
              loadingPosition="start"
            >
              New Organization
            </Button>
          </div>
          {isLoading || createOrganizationMutation.isPending ? (
            <LoaderRelative spinnerProps={{size: '32px'}} />
          ) : (
            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2 overflow-y-auto">
                {sortedTenants?.map((tenant) => (
                  <div
                    key={tenant.id}
                    className={cn(
                      'justify-start text-left w-full hover:bg-[#9BCAFF] p-[8px] rounded-[8px] hover:cursor-pointer',
                      tenant.id === authInfo?.user?.tenant?.id ? 'bg-[#9BCAFF]' : 'bg-transparent'
                    )}
                    onClick={() => {
                      analyticsTrack('CLICK_SWITCH_ORGANIZATION_CONFIRMATION');
                      handleConfirmationChange(tenant);
                    }}
                  >
                    <Typography
                      variant="captionMedium"
                      sx={{color: tenant.id === authInfo?.user?.tenant?.id ? '#0051AF' : '#00142B'}}
                    >
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
        title="Change Organization"
        description={
          <>
            This will log you out of your current organization so that you can log into <b>{tenant?.name}</b>. Do you still
            want to continue?
          </>
        }
        confirmButtonText="Continue"
        onCancel={() => {
          onChange(true);
          setTenant(undefined);
        }}
        onConfirm={() => {
          if (tenant?.id) {
            analyticsTrack('CLICK_CONFIRM_SWITCH_ORGANIZATION');
            handleSwitchTenant(tenant.id);
          }
        }}
      />
      <ConfirmModal
        open={openCreateModal}
        onCancel={() => {
          setOpenCreateModal(false);
          onChange(true);
        }}
        onConfirm={() => {
          handleCreateOrganization();
          onChange(true);
        }}
        title="Creating Organization"
        description="Are you sure you want to create a new organization? This action will create a new organization with default settings."
      />
    </>
  );
};

/* c8 ignore end */
