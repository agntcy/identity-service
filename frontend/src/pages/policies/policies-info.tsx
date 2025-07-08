/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {InfoPolicy} from '@/components/policies/info/info-agentic-service';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useDeletePolicy} from '@/mutations';
import {useGetPolicy} from '@/queries';
import {PATHS} from '@/router/paths';
import {Button, toast} from '@outshift/spark-design';
import {RefreshCcwIcon, Trash2Icon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {generatePath, useNavigate, useParams} from 'react-router-dom';

const PolicyInfo: React.FC = () => {
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const {id} = useParams<{id: string}>();

  const {data, isLoading, error, isError, refetch} = useGetPolicy(id);

  const navigate = useNavigate();

  const deleteMutation = useDeletePolicy({
    callbacks: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Policy deleted successfully.',
          type: 'success'
        });
        void navigate(PATHS.policies.base, {replace: true});
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'An error occurred while deleting the policy. Please try again.',
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
      title="Policy"
      useBorder
      breadcrumbs={[
        {
          text: 'Policies',
          link: PATHS.policies.base
        },
        {
          text: data?.name || 'Policy'
        }
      ]}
      rightSideItems={
        isError || isLoading ? null : (
          <div className="flex items-center gap-4">
            <Button
              startIcon={<Trash2Icon className="w-4 h-4" />}
              variant="outlined"
              color="negative"
              onClick={() => {
                setShowConfirmDelete(true);
              }}
              sx={{fontWeight: '600 !important'}}
              loading={deleteMutation.isPending}
              loadingPosition="start"
            >
              Delete
            </Button>
            <Button
              startIcon={<RefreshCcwIcon className="h-4 w-4" />}
              variant="secondary"
              sx={{fontWeight: '600 !important'}}
              onClick={() => {
                const path = generatePath(PATHS.policies.update, {id: id || ''});
                void navigate(path, {replace: true});
              }}
            >
              Update
            </Button>
          </div>
        )
      }
    >
      <ConditionalQueryRenderer
        itemName="Policy"
        data={data}
        error={error}
        isLoading={isLoading || deleteMutation.isPending}
        useRelativeLoader
        useContainer
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          },
          actionTitle: 'Retry'
        }}
      >
        <InfoPolicy policy={data} />
        <ConfirmModal
          open={showConfirmDelete}
          title="Delete Policy"
          description={
            <>
              Are you sure you want to delete this policy? This action cannot be undone.
              <br />
              <br />
              <strong>Note:</strong> Deleting a policy will remove it from all associated agentic services.
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

export default PolicyInfo;
