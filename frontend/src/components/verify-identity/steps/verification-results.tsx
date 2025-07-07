/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {CheckIcon, CircleAlertIcon, DownloadIcon} from 'lucide-react';
import {useStepper} from '../stepper';
import {
  Accordion,
  Badge,
  Button,
  CodeBlock,
  EmptyState,
  GeneralSize,
  Table,
  Tag,
  TagBackgroundColorVariants,
  toast,
  Typography
} from '@outshift/spark-design';
import {VerificationResult} from '@/types/api/badge';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {useCallback, useMemo} from 'react';
import DateHover from '@/components/ui/date-hover';
import {cn} from '@/lib/utils';
import ScrollShadowWrapper from '@/components/ui/scroll-shadow-wrapper';
import {Separator} from '@/components/ui/separator';

export const VerificationResults = () => {
  const methods = useStepper();
  const metaData = methods.getMetadata('verficationResults');
  const results = metaData?.results as VerificationResult | undefined;

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Identity',
        value: results?.controlledIdentifierDocument || 'Not provided'
      },
      {
        keyProp: 'Issuer',
        value: results?.controller || 'Not provided'
      },
      {
        keyProp: 'Created At',
        value: <DateHover date={results?.document?.issuanceDate || 'Not provided'} />
      },
      {
        keyProp: 'Status',
        value: (
          <div className="flex items-center gap-2">
            <Badge content={null} type={results?.status ? 'success' : 'error'} styleBadge={{width: '6px', height: '6px', padding: '0'}} />
            <Typography color="#272E37" fontSize={14}>
              {results?.status ? 'Active' : 'Revoked'}
            </Typography>
          </div>
        )
      }
    ];
    return temp;
  }, [results]);

  const handleDownloadBadge = useCallback(() => {
    if (!results) {
      toast({
        title: 'Error',
        description: 'No results available to download.',
        type: 'error'
      });
      return;
    }
    const blob = new Blob([JSON.stringify(results?.document, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `results-${results?.controlledIdentifierDocument || 'unknown'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Download started',
      description: 'Your verification results are being downloaded.',
      type: 'success'
    });
  }, [results]);

  return (
    <div className="flex gap-4">
      <div className="min-w-[40%]">
        <Card className={cn('text-start space-y-6')} variant="secondary">
          <div className="flex justify-between items-center">
            <Typography variant="subtitle1" fontWeight={600}>
              Info
            </Typography>
            <div className="flex items-center gap-2">
              {results?.status ? (
                <>
                  <CheckIcon className="w-[20px] h-[20px] text-[#00B285]" />
                  <Typography variant="body2Semibold">Verification Successful</Typography>
                </>
              ) : (
                <>
                  <CircleAlertIcon className="w-[20px] h-[20px] text-[#FF4D4F]" />
                  <Typography variant="body2Semibold">Verification Failed</Typography>
                </>
              )}
            </div>
          </div>
          <CardContent className="p-0 flex justify-between items-center">
            <KeyValue pairs={keyValuePairs} useCard={false} orientation="vertical" />
          </CardContent>
        </Card>
      </div>
      <div className="w-full">
        <Card variant="secondary" className="h-fit flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <Typography variant="subtitle1" fontWeight={600}>
              Result
            </Typography>
            {results?.status && (
              <Button
                variant="tertariary"
                endIcon={<DownloadIcon className="w-4 h-4" />}
                sx={{padding: 0, fontWeight: '600 !important'}}
                onClick={handleDownloadBadge}
              >
                Download
              </Button>
            )}
          </div>
          <div className="mt-2">
            {results?.status ? (
              <ScrollShadowWrapper className="max-h-[60vh] overflow-auto">
                <CodeBlock
                  containerProps={{maxWidth: '40vw'}}
                  showLineNumbers
                  wrapLongLines
                  text={JSON.stringify(results?.document || {}, null, 2)}
                />
              </ScrollShadowWrapper>
            ) : (
              <div>
                <Accordion
                  title="Errors"
                  subTitle={
                    (
                      <div className="flex gap-4 items-center h-[24px] mt-1">
                        <Separator orientation="vertical" />
                        <Tag size={GeneralSize.Small} color={TagBackgroundColorVariants.AccentIWeak}>
                          {results?.errors?.length || 0}
                        </Tag>
                      </div>
                    ) as any
                  }
                >
                  <Table
                    columns={[
                      {
                        accessorKey: 'message',
                        header: 'Message'
                      }
                    ]}
                    data={results?.errors || []}
                    isLoading={false}
                    densityCompact
                    enableRowActions
                    topToolbarProps={{
                      enableActions: false
                    }}
                    muiTableContainerProps={{
                      style: {
                        border: '1px solid #D5DFF7'
                      }
                    }}
                    rowCount={results?.errors?.length ?? 0}
                    rowsPerPageOptions={[1, 10, 25, 50, 100]}
                    muiBottomToolbarProps={{
                      style: {
                        boxShadow: 'none'
                      }
                    }}
                    renderTopToolbar={() => <></>}
                    renderEmptyRowsFallback={() => (
                      <EmptyState
                        title="No Errors Found"
                        description="Your verification results did not return any errors."
                        containerProps={{paddingBottom: '40px'}}
                      />
                    )}
                  />
                </Accordion>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
