/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Accordion, Divider, EmptyState, GeneralSize, Link, Pagination, Table, Tag, TagStatus, Tooltip, Typography} from '@outshift/spark-design';
import {useCallback, useMemo, useState} from 'react';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {Policy, RuleAction} from '@/types/api/policy';
import {useGetAgenticService} from '@/queries';
import {Separator} from '@/components/ui/separator';
import {labels} from '@/constants/labels';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Box, IconButton} from '@mui/material';
import {InfoIcon} from 'lucide-react';
import {generatePath} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {TagActionTask} from '@/components/shared/tag-action-task';
import {TasksColumns} from './tasks-columns';

const PAGE_SIZE = 5;

export const PolicyContent = ({policy}: {policy?: Policy}) => {
  const [pageRules, setPageRules] = useState(1);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  const {data} = useGetAgenticService(policy?.assignedTo);

  const handlePaginationRulesChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setPageRules(value);
  }, []);

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Name',
        value: policy?.name || 'Not provided'
      },
      {
        keyProp: 'Assigned To',
        value: (
          <Link href={generatePath(PATHS.agenticServices.info, {id: policy?.assignedTo || ''})}>
            <div className="flex items-center gap-2">
              <AgenticServiceType type={data?.type} showLabel={false} />
              <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
            </div>
          </Link>
        )
      },
      {
        keyProp: 'Description',
        value: policy?.description || 'Not provided'
      }
    ];
    return temp;
  }, [data?.name, data?.type, policy?.assignedTo, policy?.description, policy?.name]);

  const paginatedRules = useMemo(() => {
    const startIndex = (pageRules - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return policy?.rules?.slice(startIndex, endIndex) || [];
  }, [policy?.rules, pageRules]);

  return (
    <>
      <div className="flex gap-4">
        <div className="w-[40%]">
          <Card className="text-start space-y-6" variant="secondary">
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" fontWeight={600}>
                About
              </Typography>
            </div>
            <CardContent className="p-0 space-y-4">
              <KeyValue pairs={keyValuePairs} useCard={false} orientation="vertical" />
            </CardContent>
          </Card>
        </div>
        <div className="w-full">
          <Card className="text-start space-y-4" variant="secondary">
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" fontWeight={600}>
                {policy?.rules?.length} Policy {policy?.rules?.length && policy?.rules?.length > 1 ? 'Rules' : 'Rule'}
              </Typography>
            </div>
            <CardContent className="p-0 space-y-4">
              <div className="pt-4">
                {paginatedRules?.map((rule, index) => (
                  <div className="w-full" key={index}>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="w-full">
                        <Accordion
                          title={rule.name || `Rule ${index + 1}`}
                          subTitle={
                            (
                              <div className="flex gap-4 items-center h-[24px]">
                                <Separator orientation="vertical" />
                                <TagActionTask action={rule.action} text={labels.rulesActions[rule.action ?? RuleAction.RULE_ACTION_UNSPECIFIED]} />
                                <Tag size={GeneralSize.Medium}>
                                  {rule.tasks?.length || 0} {rule.tasks?.length && rule.tasks?.length > 1 ? 'Tasks' : 'Task'}
                                </Tag>
                                <Tag status={rule.needsApproval ? TagStatus.Positive : TagStatus.Negative} size={GeneralSize.Small}>
                                  <Typography variant="captionSemibold">
                                    Approval: <b>{rule.needsApproval ? 'Yes' : 'No'}</b>
                                  </Typography>
                                </Tag>
                              </div>
                            ) as any
                          }
                        >
                          <div>
                            <Table
                              columns={TasksColumns}
                              densityCompact
                              data={rule.tasks || []}
                              isLoading={false}
                              enableRowActions
                              topToolbarProps={{
                                enableActions: false
                              }}
                              muiTableContainerProps={{
                                style: {
                                  border: '1px solid #D5DFF7'
                                }
                              }}
                              onPaginationChange={setPagination}
                              onSortingChange={setSorting}
                              rowCount={rule.tasks?.length || 0}
                              rowsPerPageOptions={[1, 10, 25, 50, 100]}
                              state={{pagination, sorting}}
                              title={{label: 'Tasks', count: rule?.tasks?.length || 0}}
                              muiBottomToolbarProps={{
                                style: {
                                  boxShadow: 'none'
                                }
                              }}
                              renderEmptyRowsFallback={() => (
                                <Box
                                  sx={(theme) => ({
                                    backgroundColor: theme.palette.vars.controlBackgroundDefault
                                  })}
                                >
                                  <EmptyState title="No tasks found" containerProps={{paddingBottom: '40px'}} actionTitle="Add Policy" />
                                </Box>
                              )}
                            />
                            <div className="pl-[24px]">
                              <Typography variant="body2">
                                Needs Approval: <b>{rule.needsApproval ? 'Yes' : 'No'}</b>
                              </Typography>
                            </div>
                          </div>
                        </Accordion>
                      </div>
                      <Tooltip title="Update Rules and Tasks on the Update Policy page">
                        <IconButton
                          sx={(theme) => ({
                            color: theme.palette.vars.baseTextDefault,
                            width: '24px',
                            height: '24px'
                          })}
                        >
                          <InfoIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    </div>
                    <div className="my-6">
                      <Divider />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Pagination
                    size="small"
                    count={Math.ceil((policy?.rules?.length || 0) / PAGE_SIZE)}
                    page={pageRules}
                    onChange={handlePaginationRulesChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
