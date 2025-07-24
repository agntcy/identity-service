/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useGetAgenticServiceBadge} from '@/queries';
import {App} from '@/types/api/app';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Button,
  CodeBlock,
  CopyButton,
  Divider,
  Modal,
  ModalContent,
  ModalTitle,
  toast,
  Typography,
  ViewSwitcher
} from '@outshift/spark-design';
import {CheckIcon, DownloadIcon, ExpandIcon} from 'lucide-react';
import {Badge} from '@/types/api/badge';
import {useAnalytics} from '@/hooks';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {BadgeModalForm} from './badge-modal-form';
import {Card} from '@/components/ui/card';
import {IdCardIcon} from 'lucide-react';

interface BadgeCardProps {
  app?: App;
  verifyIdentity?: boolean;
  reIssueBadge?: boolean;
  navigateTo?: boolean;
  showError?: boolean;
  confirmButtonText?: string;
  onBadgeChanged?: (badge?: Badge) => void;
}

export const BadgeCard = ({
  app,
  navigateTo = true,
  verifyIdentity = false,
  reIssueBadge = false,
  confirmButtonText,
  showError = false,
  onBadgeChanged
}: BadgeCardProps) => {
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

  const {analyticsTrack} = useAnalytics();

  const navigate = useNavigate();

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
    const blob = new Blob([JSON.stringify(data.verifiableCredential, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `badge-${data?.verifiableCredential.id || 'unknown'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    analyticsTrack('CLICK_DOWNLOAD_BADGE_AGENTIC_SERVICE', {
      type: app?.type
    });
    toast({
      title: 'Download started',
      description: 'Your badge verifiable credential is being downloaded.',
      type: 'success'
    });
  }, [analyticsTrack, app?.type, data?.verifiableCredential]);

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
        emptyListStateProps={{
          title: 'No Badge',
          description: 'Create a badge for your agentic service to enable verifiable credentials.',
          actionTitle: 'Create Badge',
          actionCallback: () => {
            analyticsTrack('CLICK_NAVIGATION_CREATE_BADGE_AGENTIC_SERVICE');
            setShowBadgeForm(true);
          }
        }}
      >
        <Card variant="secondary" className="flex flex-col gap-4 h-full">
          <div className="flex justify-between items-start">
            <Typography variant="subtitle1" fontWeight={600}>
              Badge
            </Typography>
            <div className="flex gap-4 items-center">
              {verifyIdentity && (
                <>
                  <Button
                    variant="tertariary"
                    startIcon={<CheckIcon className="w-4 h-4" />}
                    sx={{padding: 0, fontWeight: '600 !important'}}
                    onClick={() => {
                      const path = generatePath(PATHS.verifyIdentity.info, {id: app?.id || ''});
                      void navigate(path, {replace: true});
                    }}
                  >
                    Verify Identity
                  </Button>
                  <Divider orientation="vertical" sx={{margin: '0 auto', height: '20px'}} />
                </>
              )}
              {reIssueBadge && (
                <>
                  <Button
                    variant="tertariary"
                    startIcon={<IdCardIcon className="w-4 h-4" />}
                    sx={{padding: 0, fontWeight: '600 !important'}}
                    onClick={() => {
                      analyticsTrack('CLICK_REISSUE_BADGE_AGENTIC_SERVICE', {
                        type: app?.type
                      });
                      setShowBadgeForm(true);
                    }}
                  >
                    Re-Issue Badge
                  </Button>
                  <Divider orientation="vertical" sx={{margin: '0 auto', height: '20px'}} />
                </>
              )}
              <Button
                variant="tertariary"
                startIcon={<DownloadIcon className="w-4 h-4" />}
                sx={{padding: 0, fontWeight: '600 !important'}}
                onClick={handleDownloadBadge}
              >
                Download
              </Button>
              <Divider orientation="vertical" sx={{margin: '0 auto', height: '20px'}} />
              <Button
                variant="tertariary"
                startIcon={<ExpandIcon className="w-[14px] h-[14px]" />}
                sx={{padding: 0, fontWeight: '600 !important'}}
                onClick={() => {
                  analyticsTrack('CLICK_VIEW_BADGE_AGENTIC_SERVICE');
                  setShowBadge(true);
                }}
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
                  if (newView === 'credential') {
                    analyticsTrack('CLICK_VIEW_CREDENTIAL_BADGE_AGENTIC_SERVICE');
                  } else if (newView === 'claims') {
                    analyticsTrack('CLICK_VIEW_CLAIMS_BADGE_AGENTIC_SERVICE');
                  } else if (newView === 'jose') {
                    analyticsTrack('CLICK_VIEW_JOSE_BADGE_AGENTIC_SERVICE');
                  }
                  setView(newView);
                }}
                size="sm"
              />
            </div>
            <ScrollShadowWrapper className="max-h-[50vh] overflow-auto">
              {view === 'credential' && (
                <CodeBlock containerProps={{maxWidth: '40vw'}} wrapLongLines text={JSON.stringify(contentToShow, null, 2)} />
              )}
              {view === 'claims' && (
                <CodeBlock containerProps={{maxWidth: '40vw'}} wrapLongLines text={JSON.stringify(contentToShow, null, 2)} />
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
            <CodeBlock wrapLongLines text={JSON.stringify(data?.verifiableCredential, null, 2)} />
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
