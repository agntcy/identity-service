/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {DownloadIcon, ExpandIcon, PlusIcon} from 'lucide-react';
import {Button, CodeBlock, CopyButton, EmptyState, GeneralSize, Modal, ModalContent, ModalTitle, toast, Typography} from '@outshift/spark-design';
import {useCallback, useMemo, useState} from 'react';
import {App} from '@/types/api/app';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {Badge} from '@/types/api/badge';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {BadgeModalForm} from '@/components/shared/badge-modal-form';

export const CreateBadge = ({app}: {app?: App}) => {
  const [badge, setBadge] = useState<Badge | undefined>(undefined);
  const [showBadge, setShowBadge] = useState<boolean>(false);
  const [showBadgeForm, setShowBadgeForm] = useState<boolean>(false);

  const navigate = useNavigate();

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Name',
        value: app?.name || 'Not provided'
      },
      {
        keyProp: 'Description',
        value: app?.description || 'Not provided'
      },
      {
        keyProp: 'Type',
        value: <AgenticServiceType type={app?.type} />
      }
    ];
    return temp;
  }, [app?.description, app?.name, app?.type]);

  const handleDownloadBadge = useCallback(() => {
    if (!badge?.verifiableCredential) {
      toast({
        title: 'Error',
        description: 'No badge data available to download.',
        type: 'error'
      });
      return;
    }
    const blob = new Blob([JSON.stringify(badge.verifiableCredential, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `badge-${badge?.verifiableCredential.id || 'unknown'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Download started',
      description: 'Your badge verifiable credential is being downloaded.',
      type: 'success'
    });
  }, [badge?.verifiableCredential]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-[40%] space-y-4">
          <Card className="text-start space-y-4" variant="secondary">
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" fontWeight={600}>
                About
              </Typography>
            </div>
            <CardContent className="p-0 space-y-4">
              <KeyValue pairs={keyValuePairs} useCard={false} />
            </CardContent>
          </Card>
          <Card className="text-start space-y-4" variant="secondary">
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" fontWeight={600}>
                API Key
              </Typography>
            </div>
            <CardContent className="p-0 space-y-4">
              <div className="bg-[#FBFCFE] border border-[#D5DFF7] rounded-[6px] w-fit py-2 px-4 flex justify-between items-center gap-8 w-full">
                <Typography variant="body2">{app?.apiKey ? `${'*'.repeat(20)}${app.apiKey.slice(-5)}` : 'No API Key available'}</Typography>
                <CopyButton
                  text={app?.apiKey || ''}
                  style={{border: 'none'}}
                  onCopy={() => {
                    toast({
                      title: 'API Key copied to clipboard',
                      description: 'You can now use this API Key in your applications.',
                      type: 'success'
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-full">
          <Card variant="secondary" className="h-full flex flex-col justify-center">
            {!badge ? (
              <EmptyState
                size={GeneralSize.Large}
                title="No Badge"
                description="Create a badge for your agentic service to enable verifiable credentials."
                actionTitle="Create Badge"
                actionCallback={() => setShowBadgeForm(true)}
                actionButtonProps={{
                  sx: {fontWeight: '600 !important'},
                  startIcon: <PlusIcon className="w-4 h-4" />
                }}
                containerProps={{paddingBottom: '40px'}}
              />
            ) : (
              <div className="space-y-4">
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
                  <CodeBlock
                    containerProps={{maxWidth: '50vw'}}
                    showLineNumbers
                    wrapLongLines
                    text={JSON.stringify(badge.verifiableCredential, null, 2)}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            const path = generatePath(PATHS.agenticServices.info, {id: app?.id});
            void navigate(path, {replace: true});
          }}
        >
          {badge ? 'Done' : 'Skip'}
        </Button>
      </div>
      {badge && (
        <Modal open={showBadge} onClose={() => setShowBadge(false)} fullWidth maxWidth="xl">
          <div className="flex justify-between items-center">
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
            <CodeBlock showLineNumbers wrapLongLines text={JSON.stringify(badge?.verifiableCredential, null, 2)} />
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
          onBadgeCreated={(createdBadge) => {
            setBadge(createdBadge);
            setShowBadgeForm(false);
          }}
          navigateTo={false}
        />
      )}
    </div>
  );
};
