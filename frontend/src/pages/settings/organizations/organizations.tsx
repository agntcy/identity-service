/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {ListOrganizations} from '@/components/organizations/list/list-organizations';
import {ConfirmModal} from '@/components/ui/confirm-modal';
import {useCreateTenant} from '@/mutations';
import {PATHS} from '@/router/paths';
import {Button, toast} from '@outshift/spark-design';
import {PlusIcon} from 'lucide-react';
import {useCallback, useState} from 'react';

const Organizations: React.FC = () => {
  const [openCreateModal, setOpenCreateModal] = useState(false);

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
    setOpenCreateModal(false);
    createOrganizationMutation.mutate();
  }, [createOrganizationMutation]);

  return (
    <BasePage
      title="Organizations & Users"
      subNav={[
        {
          label: 'Identity Provider',
          href: PATHS.settings.identityProvider.base
        },
        {
          label: 'Devices',
          href: PATHS.settings.devices.base
        },
        {
          label: 'API Key',
          href: PATHS.settings.apiKey
        },
        {
          label: 'Organizations & Users',
          href: PATHS.settings.organizationsAndUsers.base
        }
      ]}
      breadcrumbs={[
        {
          text: 'Settings',
          link: PATHS.settings.base
        },
        {
          text: 'Organizations'
        }
      ]}
      rightSideItems={
        <Button
          loading={createOrganizationMutation.isPending}
          loadingPosition="start"
          onClick={() => {
            setOpenCreateModal(true);
          }}
          variant="outlined"
          startIcon={<PlusIcon className="w-4 h-4" />}
          fullWidth
          sx={{fontWeight: '600 !important'}}
        >
          New Organization
        </Button>
      }
    >
      <ListOrganizations />
      <ConfirmModal
        open={openCreateModal}
        onCancel={() => setOpenCreateModal(false)}
        onConfirm={() => {
          handleCreateOrganization();
        }}
        title="Creating Organization"
        description="Are you sure you want to create a new organization? This action will create a new organization with default settings."
      />
    </BasePage>
  );
};

export default Organizations;
