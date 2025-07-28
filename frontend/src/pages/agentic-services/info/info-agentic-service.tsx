/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {BadgeModalForm} from '@/components/shared/agentic-services/badge-modal-form';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useAnalytics} from '@/hooks';
import {useDeleteAgenticService} from '@/mutations';
import {useGetAgenticService} from '@/queries';
import {PATHS} from '@/router/paths';
import {useFeatureFlagsStore} from '@/store';
import {Button, toast} from '@outshift/spark-design';
import {PencilIcon, Trash2Icon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {generatePath, Outlet, useNavigate, useParams} from 'react-router-dom';
import {useShallow} from 'zustand/react/shallow';

const InfoAgenticService: React.FC = () => {
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const isPoliciesAssignedTo = window.location.pathname.includes('policies-assigned-to');
  const isPoliciesUsedBy = window.location.pathname.includes('policies-used-by');

  const {id} = useParams<{id: string}>();

  const {data, isLoading, error, isError, refetch} = useGetAgenticService(id);

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

  const {isTbacEnable} = useFeatureFlagsStore(
    useShallow((state) => ({
      isTbacEnable: state.featureFlags.isTbacEnable
    }))
  );

  const deleteMutation = useDeleteAgenticService({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Agentic service deleted successfully.',
          type: 'success'
        });
        void navigate(PATHS.agenticServices.base, {replace: true});
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the agentic service. Please try again.',
          type: 'error'
        });
      }
    }
  });

  const handleClickOnDelete = useCallback(() => {
    analyticsTrack('CLICK_CONFIRM_DELETE_AGENTIC_SERVICE', {
      type: data?.type
    });
    setShowConfirmDelete(false);
    deleteMutation.mutate(id || '');
  }, [analyticsTrack, data?.type, deleteMutation, id]);

  return (
    <BasePage
      title="Agentic Service"
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: data?.name || 'Agentic Service',
          link:
            isPoliciesAssignedTo || isPoliciesUsedBy
              ? generatePath(PATHS.agenticServices.info.base, {id: id || ''})
              : undefined
        },
        ...(isPoliciesAssignedTo
          ? [
              {
                text: 'Policies Assigned To'
              }
            ]
          : []),
        ...(isPoliciesUsedBy
          ? [
              {
                text: 'Policies Used By'
              }
            ]
          : [])
      ]}
      subNav={
        isTbacEnable
          ? [
              {
                label: 'About',
                href: generatePath(PATHS.agenticServices.info.base, {id: id || ''})
              },
              {
                label: 'Policies Assigned To',
                href: generatePath(PATHS.agenticServices.info.policiesAssignedTo, {id: id || ''})
              },
              {
                label: 'Policies Used By',
                href: generatePath(PATHS.agenticServices.info.policiesUsedBy, {id: id || ''})
              }
            ]
          : undefined
      }
      rightSideItems={
        isError || isLoading ? null : (
          <div className="flex items-center gap-4">
            <Button
              startIcon={<Trash2Icon className="w-4 h-4" />}
              variant="outlined"
              color="negative"
              onClick={() => {
                analyticsTrack('CLICK_DELETE_AGENTIC_SERVICE', {
                  type: data?.type
                });
                setShowConfirmDelete(true);
              }}
              sx={{fontWeight: '600 !important'}}
              loading={deleteMutation.isPending}
              loadingPosition="start"
            >
              Delete
            </Button>
            <Button
              startIcon={<PencilIcon className="h-4 w-4" />}
              variant="secondary"
              sx={{fontWeight: '600 !important'}}
              onClick={() => {
                analyticsTrack('CLICK_NAVIGATION_EDIT_AGENTIC_SERVICE', {
                  type: data?.type
                });
                const path = generatePath(PATHS.agenticServices.edit, {id: id || ''});
                void navigate(path, {replace: true});
              }}
            >
              Edit
            </Button>
          </div>
        )
      }
    >
      <ConditionalQueryRenderer
        itemName="Agentic Service"
        data={data}
        error={error}
        isLoading={isLoading || deleteMutation.isPending}
        useRelativeLoader
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <Outlet context={{app: data}} />
        {data && (
          <BadgeModalForm
            app={data}
            open={showBadgeForm}
            onClose={() => {
              setShowBadgeForm(false);
            }}
            onCancel={() => {
              setShowBadgeForm(false);
            }}
            onBadgeCreated={() => {
              setShowBadgeForm(false);
            }}
            navigateTo={false}
            confirmButtonText="Re-Issue"
            title="Re-Issue Badge"
          />
        )}
        <ConfirmModal
          open={showConfirmDelete}
          title="Delete Agentic Service"
          description={
            <>
              Are you sure you want to delete this agentic service <b>{data?.name}</b>? This action cannot be undone.
              {isTbacEnable && (
                <>
                  <br />
                  <br />
                  <strong>Note:</strong> If this agentic service is a TBAC service, it will also remove the associated TBAC
                  policies.
                </>
              )}
            </>
          }
          confirmButtonText="Delete"
          onCancel={() => {
            setShowConfirmDelete(false);
          }}
          onConfirm={handleClickOnDelete}
          buttonConfirmProps={{
            color: 'negative'
          }}
        />
      </ConditionalQueryRenderer>
    </BasePage>
  );
};

export default InfoAgenticService;
