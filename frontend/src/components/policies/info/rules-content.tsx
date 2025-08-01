/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Accordion, Divider, EmptyState, GeneralSize, Pagination, Table, Tag, Typography} from '@outshift/spark-design';
import {useCallback, useMemo, useState} from 'react';
import {Policy, Rule, RuleAction} from '@/types/api/policy';
import {Separator} from '@/components/ui/separator';
import {labels} from '@/constants/labels';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Box, Button} from '@mui/material';
import {PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {TagActionTask} from '@/components/shared/policies/tag-action-task';
import {TasksColumns} from './tasks-columns';
import {OpsRule} from '@/components/shared/ops-rules/ops-rule';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetPolicyRules} from '@/queries';
import {useAnalytics} from '@/hooks';
import {ActionMenuItem, ActionsMenu} from '@/components/ui/actions-menu';

const PAGE_SIZE = 5;

export const RulesContent = ({policy}: {policy?: Policy}) => {
  const [pageRules, setPageRules] = useState(1);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 5
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [tempRule, setTempRule] = useState<Rule | undefined>(undefined);
  const [isDelete, setIsDelete] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isAdd, setIsAdd] = useState<boolean>(false);

  const {analyticsTrack} = useAnalytics();

  const handlePaginationRulesChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setPageRules(value);
  }, []);

  const {data, isLoading, error, refetch} = useGetPolicyRules({
    policyId: policy?.id,
    query: {
      page: pageRules,
      size: PAGE_SIZE
    }
  });

  const dataCount = useMemo(() => {
    return Number(data?.pagination?.total) || 0;
  }, [data]);

  const handleOnClose = useCallback(() => {
    setPageRules(1);
    setTempRule(undefined);
    setIsDelete(false);
    setIsEdit(false);
    setIsAdd(false);
  }, []);

  const getMenuItems = useCallback(
    (rule: Rule): ActionMenuItem[] => [
      {
        key: 'edit-rule',
        label: 'Edit',
        icon: <PencilIcon className="w-4 h-4" color="#062242" />,
        textColor: '#1A1F27',
        onClick: () => {
          analyticsTrack('CLICK_EDIT_RULE_POLICY');
          setTempRule(rule);
          setIsEdit(true);
        }
      },
      {
        key: 'delete-rule',
        label: 'Delete',
        icon: <Trash2Icon className="w-4 h-4" color="#C62953" />,
        textColor: '#C0244C',
        onClick: () => {
          analyticsTrack('CLICK_DELETE_RULE_POLICY');
          setTempRule(rule);
          setIsDelete(true);
        }
      }
    ],
    [analyticsTrack, setTempRule, setIsEdit, setIsDelete]
  );

  return (
    <>
      <div className="w-full">
        <ConditionalQueryRenderer
          itemName="Rules"
          data={data?.rules}
          error={error}
          isLoading={isLoading}
          useRelativeLoader
          errorListStateProps={{
            actionCallback: () => {
              void refetch();
            }
          }}
          emptyListStateProps={{
            actionCallback: () => {
              analyticsTrack('CLICK_ADD_RULE_POLICY');
              setIsAdd(true);
            },
            actionTitle: 'Add Rule',
            title: 'No Rules Found',
            description: 'Create a new rule associated with this policy to get started.'
          }}
        >
          <Card variant="secondary">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Typography variant="subtitle1" fontWeight={600}>
                  {dataCount} {dataCount && dataCount > 1 ? 'Rules' : 'Rule'}
                </Typography>
                <Button
                  onClick={() => {
                    analyticsTrack('CLICK_ADD_RULE_POLICY');
                    setTempRule(undefined);
                    setIsAdd(true);
                  }}
                  variant="primary"
                  startIcon={<PlusIcon className="w-4 h-4" />}
                  sx={{fontWeight: '600 !important'}}
                  size="small"
                >
                  Add Rule
                </Button>
              </div>
              <CardContent className="p-0 space-y-4">
                <div className="pt-4">
                  {data?.rules?.map((rule, index) => (
                    <div className="w-full" key={index}>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="w-full">
                          <Accordion
                            defaultExpanded={index === 0}
                            title={rule.name || `Rule ${index + 1}`}
                            subTitle={
                              (
                                <div className="flex gap-4 items-center h-[24px]">
                                  <Separator orientation="vertical" />
                                  <TagActionTask
                                    action={rule.action}
                                    text={labels.rulesActions[rule.action ?? RuleAction.RULE_ACTION_UNSPECIFIED]}
                                  />
                                  <Tag size={GeneralSize.Medium}>
                                    {rule.tasks?.length || 0}{' '}
                                    {rule.tasks?.length && rule.tasks?.length > 1 ? 'Tasks' : 'Task'}
                                  </Tag>
                                  <Tag size={GeneralSize.Small}>
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
                                enableColumnResizing
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
                                    <EmptyState
                                      title="No tasks found"
                                      containerProps={{paddingBottom: '40px'}}
                                      actionTitle="Add Policy"
                                    />
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
                        <ActionsMenu items={getMenuItems(rule)} />
                      </div>
                      <div className="my-6">
                        <Divider />
                      </div>
                    </div>
                  ))}
                  {dataCount > 5 && (
                    <div className="flex justify-end">
                      <Pagination
                        count={Math.ceil(dataCount / PAGE_SIZE)}
                        page={pageRules}
                        onChange={handlePaginationRulesChange}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        </ConditionalQueryRenderer>
        <OpsRule policy={policy} rule={tempRule} isDelete={isDelete} isEdit={isEdit} isAdd={isAdd} onClose={handleOnClose} />
      </div>
    </>
  );
};
