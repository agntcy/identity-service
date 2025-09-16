/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {PolicyContent} from '@/components/policies/info/policy-content';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useAnalytics} from '@/hooks';
import {useDeletePolicy} from '@/mutations';
import {useGetPolicy} from '@/queries';
import {PATHS} from '@/router/paths';
import {Button, toast} from '@outshift/spark-design';
import {PencilIcon, Trash2Icon} from 'lucide-react';
import {useCallback, useState} from 'react';
import {generatePath, useNavigate, useParams} from 'react-router-dom';

const InfoPolicy: React.FC = () => {
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const {id} = useParams<{id: string}>();

  const {data, isLoading, error, isError, refetch} = useGetPolicy(id);

  const navigate = useNavigate();

  const {analyticsTrack} = useAnalytics();

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
    analyticsTrack('CLICK_CONFIRM_DELETE_POLICY');
    setShowConfirmDelete(false);
    deleteMutation.mutate(id || '');
  }, [analyticsTrack, deleteMutation, id]);

  return (
    <BasePage
      title="Policy"
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
                analyticsTrack('CLICK_DELETE_POLICY');
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
                analyticsTrack('CLICK_NAVIGATION_EDIT_POLICY');
                const path = generatePath(PATHS.policies.edit, {id: id || ''});
                void navigate(path);
              }}
            >
              Edit
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
        errorListStateProps={{
          actionCallback: () => {
            void refetch();
          }
        }}
      >
        <PolicyContent policy={data} />
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

export default InfoPolicy;
