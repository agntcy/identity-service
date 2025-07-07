/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {InfoAgenticService} from '@/components/agentic-services/info/info-agentic-service';
import {BasePage} from '@/components/layout/base-page';
import {BadgeModalForm} from '@/components/shared/badge-modal-form';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useDeleteAgenticService} from '@/mutations';
import {useGetAgenticService} from '@/queries';
import {PATHS} from '@/router/paths';
import {Button, toast} from '@outshift/spark-design';
import {IdCardIcon, RefreshCcwIcon, Trash2Icon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {generatePath, useNavigate, useParams} from 'react-router-dom';

const AgenticServiceInfo: React.FC = () => {
  const [showReissueBadge, setShowReissueBadge] = useState<boolean>(false);
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const {id} = useParams<{id: string}>();

  const {data, isLoading, isFetching, error, isError, refetch} = useGetAgenticService(id);

  const navigate = useNavigate();

  const deleteMutation = useDeleteAgenticService({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Agentic service deleted successfully.',
          type: 'success'
        });
        void navigate(PATHS.agenticServices.base);
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
    setShowConfirmDelete(false);
    deleteMutation.mutate(id || '');
  }, [deleteMutation, id]);

  return (
    <BasePage
      title="Agentic Service"
      useBorder
      breadcrumbs={[
        {
          text: 'Agentic Services',
          link: PATHS.agenticServices.base
        },
        {
          text: data?.name || 'Agentic Service'
        }
      ]}
      rightSideItems={
        isError || isLoading || isFetching ? null : (
          <div className="flex items-center gap-4">
            <Button
              startIcon={<Trash2Icon className="w-4 h-4" />}
              variant="outlined"
              color="negative"
              onClick={() => {
                setShowConfirmDelete(true);
              }}
              sx={{fontWeight: '600 !important'}}
            >
              Delete
            </Button>
            <Button
              startIcon={<RefreshCcwIcon className="h-4 w-4" />}
              variant="secondary"
              sx={{fontWeight: '600 !important'}}
              onClick={() => {
                const path = generatePath(PATHS.agenticServices.update, {id: id || ''});
                void navigate(path, {replace: true});
              }}
            >
              Update
            </Button>
            {showReissueBadge && (
              <Button
                onClick={() => {
                  setShowBadgeForm(true);
                }}
                startIcon={<IdCardIcon className="w-4 h-4" />}
                variant="primary"
                sx={{fontWeight: '600 !important'}}
              >
                Re-Issue Badge
              </Button>
            )}
          </div>
        )
      }
    >
      <ConditionalQueryRenderer
        itemName="Agentic Service"
        data={data}
        error={error}
        isLoading={isLoading || isFetching}
        useRelativeLoader
        useContainer
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          },
          actionTitle: 'Retry'
        }}
      >
        <InfoAgenticService app={data} onChangeReissueBadge={(value) => setShowReissueBadge(value)} />
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
            confirmButtonText="Re-Issue Badge"
          />
        )}
        <ConfirmModal
          open={showConfirmDelete}
          title="Delete Agentic Service"
          description={
            <>
              Are you sure you want to delete this agentic service <b>{data?.name}</b>? This action cannot be undone.
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

export default AgenticServiceInfo;
