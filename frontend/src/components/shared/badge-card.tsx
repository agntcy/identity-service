/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useGetAgenticServiceBadge} from '@/queries';
import {Card} from '../ui/card';
import {App} from '@/types/api/app';
import {useCallback, useEffect, useState} from 'react';
import {Button, CodeBlock, Modal, ModalContent, ModalTitle, toast, Typography} from '@outshift/spark-design';
import {ConditionalQueryRenderer} from '../ui/conditional-query-renderer';
import {DownloadIcon, ExpandIcon, PlusIcon} from 'lucide-react';
import {BadgeModalForm} from './badge-modal-form';
import {Badge} from '@/types/api/badge';

interface BadgeCardProps {
  app?: App;
  navigateTo?: boolean;
  onBadgeChanged?: (badge?: Badge) => void;
}

export const BadgeCard = ({app, navigateTo = true, onBadgeChanged}: BadgeCardProps) => {
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);
  const [showBadge, setShowBadge] = useState<boolean>(false);

  const {data, isLoading} = useGetAgenticServiceBadge(app?.id);

  const handleDownloadBadge = useCallback(() => {
    if (!data?.verifiableCredential) {
      toast({
        title: 'Error',
        description: 'No badge data available to download.',
        type: 'error'
      });
      return;
    }
    const blob = new Blob([JSON.stringify(data.verifiableCredential, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `badge-${data?.verifiableCredential.id || 'unknown'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Download started',
      description: 'Your badge verifiable credential is being downloaded.',
      type: 'success'
    });
  }, [data?.verifiableCredential]);

  useEffect(() => {
    onBadgeChanged?.(data);
  }, [data, onBadgeChanged]);

  return (
    <>
      <ConditionalQueryRenderer
        itemName="Badge"
        data={data?.verifiableCredential}
        error={undefined}
        isLoading={isLoading}
        useRelativeLoader
        useContainer
        emptyListStateProps={{
          title: 'No Badge',
          description: 'Create a badge for your agentic service to enable verifiable credentials.',
          actionTitle: 'Create Badge',
          actionCallback: () => {
            setShowBadgeForm(true);
          },
          actionButtonProps: {
            sx: {fontWeight: '600 !important'},
            startIcon: <PlusIcon className="w-4 h-4" />
          }
        }}
      >
        <Card variant="secondary" className="h-full flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <Typography variant="subtitle1" fontWeight={600}>
              Badge
            </Typography>
            <div className="flex gap-4">
              <Button
                variant="tertariary"
                endIcon={<DownloadIcon className="w-4 h-4" />}
                sx={{padding: 0, fontWeight: '600 !important'}}
                onClick={handleDownloadBadge}
              >
                Download
              </Button>
              <Button
                variant="tertariary"
                endIcon={<ExpandIcon className="w-4 h-4" />}
                sx={{padding: 0, fontWeight: '600 !important'}}
                onClick={() => setShowBadge(true)}
              >
                Show
              </Button>
            </div>
          </div>
          <div>
            <CodeBlock containerProps={{maxWidth: '50vw'}} showLineNumbers wrapLongLines text={JSON.stringify(data?.verifiableCredential, null, 2)} />
          </div>
        </Card>
      </ConditionalQueryRenderer>
      {data?.verifiableCredential && (
        <Modal open={showBadge} onClose={() => setShowBadge(false)} fullWidth maxWidth="xl">
          <div className="flex justify-between items-start">
            <ModalTitle>Badge</ModalTitle>
            <Button
              variant="tertariary"
              endIcon={<DownloadIcon className="w-4 h-4" />}
              sx={{padding: 0, fontWeight: '600 !important'}}
              onClick={handleDownloadBadge}
            >
              Download
            </Button>
          </div>
          <ModalContent>
            <CodeBlock showLineNumbers wrapLongLines text={JSON.stringify(data?.verifiableCredential, null, 2)} />
          </ModalContent>
        </Modal>
      )}
      {app && (
        <BadgeModalForm
          app={app}
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
          navigateTo={navigateTo}
        />
      )}
    </>
  );
};
