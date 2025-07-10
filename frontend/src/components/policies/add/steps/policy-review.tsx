/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Accordion, Divider, EmptyState, GeneralSize, Pagination, Table, Tag, TagStatus, Typography} from '@outshift/spark-design';
import {useCallback, useMemo, useState} from 'react';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {AgenticServiceType} from '@/components/shared/agentic-service-type';
import {useGetAgenticService, useGetGetTasksAgenticService} from '@/queries';
import {Separator} from '@/components/ui/separator';
import {labels} from '@/constants/labels';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Skeleton} from '@mui/material';
import {useStepper} from '../stepper';
import {PolicyFormValues} from '@/schemas/policy-schema';
import {PolicyLogicyFormValues} from '@/schemas/policy-logic-schema';
import {RuleAction} from '@/types/api/policy';
import {RuleFormValues} from '@/schemas/rule-schema';
import {TagActionTask} from '@/components/shared/tag-action-task';

const PAGE_SIZE = 5;

export const PolicyReview = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 15
  });
  const [pageRules, setPageRules] = useState(1);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  const methods = useStepper();
  const policy = methods.getMetadata('policyForm') as PolicyFormValues | undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rules = (methods.getMetadata('policyLogic')?.rules || []) as PolicyLogicyFormValues['rules'] | undefined;

  const {data: data, isLoading, isError} = useGetAgenticService(policy?.assignedTo);

  const paginatedRules = useMemo(() => {
    const startIndex = (pageRules - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return rules?.slice(startIndex, endIndex) || [];
  }, [rules, pageRules]);

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [
      {
        keyProp: 'Name',
        value: policy?.name || 'Not provided'
      },
      {
        keyProp: 'Assigned To',
        value: (
          <div className="flex items-center gap-2">
            {isLoading || isError ? (
              <Skeleton width={60} height={20} />
            ) : (
              <>
                <AgenticServiceType type={data?.type} className="h-[20px] w-[20px]" showLabel={false} />
                <Typography variant="body2">{data?.name ?? 'Not provided'}</Typography>
              </>
            )}
          </div>
        )
      },
      {
        keyProp: 'Description',
        value: policy?.description || 'Not provided'
      }
    ];
    return temp;
  }, [data?.name, data?.type, isError, isLoading, policy?.description, policy?.name]);

  const TasksTable = ({rule}: {rule: RuleFormValues}) => {
    const {data, isError, isLoading} = useGetGetTasksAgenticService(policy?.assignedTo);

    const dataTask = useMemo(() => {
      if (!data || !rule.tasks) {
        return [];
      }
      return rule.tasks.tasks.map((taskId) => {
        const task = data.tasks?.find((t) => t.id === taskId);
        return {
          name: task?.name || '',
          toolName: task?.toolName || ''
        };
      });
    }, [data, rule.tasks]);

    if (isError) {
      return (
        <div className="flex justify-center items-center h-[200px]">
          <Typography variant="body2" color="error">
            Error loading tasks
          </Typography>
        </div>
      );
    }

    return (
      <Table
        columns={[
          {
            accessorKey: 'name',
            header: 'Name',
            enableSorting: true
          }
        ]}
        data={dataTask}
        isLoading={isLoading}
        topToolbarProps={{
          enableActions: false
        }}
        densityCompact
        muiTableContainerProps={{
          style: {
            border: '1px solid #D5DFF7'
          }
        }}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        rowCount={dataTask.length}
        rowsPerPageOptions={[1, 15, 25, 50, 100]}
        state={{pagination, sorting}}
        title={{label: 'Tasks', count: dataTask.length}}
        muiBottomToolbarProps={{
          style: {
            boxShadow: 'none'
          }
        }}
        renderEmptyRowsFallback={() => <EmptyState title="No tasks found" containerProps={{paddingBottom: '40px'}} actionTitle="Add Policy" />}
      />
    );
  };

  const handlePaginationRulesChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setPageRules(value);
  }, []);

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
                {rules?.length} Policy {rules?.length && rules?.length > 1 ? 'Rules' : 'Rule'}
              </Typography>
            </div>
            <CardContent className="p-0 space-y-4">
              <div className="pt-4">
                {paginatedRules?.map((rule, index) => (
                  <div className="w-full" key={index}>
                    <Accordion
                      title={rule.name || `Rule ${index + 1}`}
                      subTitle={
                        (
                          <div className="flex gap-4 items-center h-[24px]">
                            <Separator orientation="vertical" />
                            <TagActionTask
                              action={rule.tasks.action}
                              text={labels.rulesActions[rule.tasks.action ?? RuleAction.RULE_ACTION_UNSPECIFIED]}
                            />
                            <Tag size={GeneralSize.Medium}>
                              {rule.tasks?.tasks?.length || 0} {rule?.tasks?.tasks?.length && rule?.tasks?.tasks?.length > 1 ? 'Tasks' : 'Task'}
                            </Tag>
                            <Tag status={TagStatus.Info} size={GeneralSize.Medium}>
                              <Typography variant="captionSemibold">
                                Approval: <b>{rule.needsApproval ? 'Yes' : 'No'}</b>
                              </Typography>
                            </Tag>
                          </div>
                        ) as any
                      }
                    >
                      <div>
                        <TasksTable rule={rule} />
                        <div className="pl-[24px]">
                          <Typography variant="body2">
                            Needs Approval: <b>{rule.needsApproval ? 'Yes' : 'No'}</b>
                          </Typography>
                        </div>
                      </div>
                    </Accordion>
                    <div className="my-6">
                      <Divider />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Pagination
                    size="small"
                    count={Math.ceil((rules?.length || 0) / PAGE_SIZE)}
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
