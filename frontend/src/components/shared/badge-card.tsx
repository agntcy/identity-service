/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useGetAgenticServiceBadge} from '@/queries';
import {Card} from '../ui/card';
import {App} from '@/types/api/app';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, CodeBlock, CopyButton, Modal, ModalContent, ModalTitle, toast, Typography, ViewSwitcher} from '@outshift/spark-design';
import {ConditionalQueryRenderer} from '../ui/conditional-query-renderer';
import {DownloadIcon, ExpandIcon, PlusIcon} from 'lucide-react';
import {BadgeModalForm} from './badge-modal-form';
import {Badge} from '@/types/api/badge';
import ScrollShadowWrapper from '../ui/scroll-shadow-wrapper';

interface BadgeCardProps {
  app?: App;
  navigateTo?: boolean;
  showError?: boolean;
  confirmButtonText?: string;
  onBadgeChanged?: (badge?: Badge) => void;
}

export const BadgeCard = ({app, navigateTo = true, confirmButtonText, showError = false, onBadgeChanged}: BadgeCardProps) => {
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);
  const [showBadge, setShowBadge] = useState<boolean>(false);
  const [view, setView] = useState('credential');
  const options = [
    {
      value: 'credential',
      label: 'Credential'
    },
    {
      value: 'jose',
      label: 'JOSE'
    },
    {
      value: 'claims',
      label: 'Claims'
    }
  ];

  const {data, isLoading, isError} = useGetAgenticServiceBadge(app?.id);

  const contentToShow = useMemo(() => {
    if (view === 'credential') {
      return {
        ...data?.verifiableCredential,
        badge: {
          ...JSON.parse(data?.verifiableCredential?.credentialSubject?.badge || '{}')
        }
      };
    } else if (view === 'jose') {
      return data?.verifiableCredential?.proof?.proofValue || '';
    } else if (view === 'claims') {
      return {
        ...JSON.parse(data?.verifiableCredential?.credentialSubject?.badge || '{}')
      };
    }
    return data?.verifiableCredential || {};
  }, [data?.verifiableCredential, view]);

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

  useEffect(() => {
    if (isError && showError && !isLoading) {
      toast({
        title: 'Fetching Badge',
        description: 'There was an error fetching the badge for this agentic service.',
        type: 'info'
      });
    }
  }, [isError, isLoading, showError]);

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
          <div className="space-y-4">
            <div className="flex justify-end">
              <ViewSwitcher
                options={options}
                value={view}
                onChange={(newView) => {
                  setView(newView);
                }}
                size="sm"
              />
            </div>
            <ScrollShadowWrapper className="max-h-[60vh] overflow-auto">
              {view === 'credential' && (
                <CodeBlock containerProps={{maxWidth: '50vw'}} showLineNumbers wrapLongLines text={JSON.stringify(contentToShow, null, 2)} />
              )}
              {view === 'claims' && (
                <CodeBlock containerProps={{maxWidth: '50vw'}} showLineNumbers wrapLongLines text={JSON.stringify(contentToShow, null, 2)} />
              )}
              {view === 'jose' && (
                <div className="border border-solid border-[#d5dff7] p-4 w-full rounded-[6px] bg-[#fbfcfe] relative">
                  <div className="pt-10">
                    <Typography className="break-all" variant="caption">
                      {contentToShow}
                    </Typography>
                  </div>
                  <div className="absolute top-4 right-4">
                    <CopyButton text={contentToShow} />
                  </div>
                </div>
              )}
            </ScrollShadowWrapper>
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
          confirmButtonText={confirmButtonText}
          navigateTo={navigateTo}
        />
      )}
    </>
  );
};
