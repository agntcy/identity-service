/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {Accordion, Divider, EmptyState, GeneralSize, MenuItem, Pagination, Table, Tag, TagStatus, Typography} from '@outshift/spark-design';
import {useCallback, useState} from 'react';
import {Policy, Rule, RuleAction} from '@/types/api/policy';
import {Separator} from '@/components/ui/separator';
import {labels} from '@/constants/labels';
import {MRT_PaginationState, MRT_SortingState} from 'material-react-table';
import {Box, Button, IconButton, Menu, Tooltip} from '@mui/material';
import {EllipsisVerticalIcon, PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react';
import {TagActionTask} from '@/components/shared/tag-action-task';
import {TasksColumns} from './tasks-columns';
import {OpsRule} from '@/components/shared/ops-rules/ops-rule';
import {ConditionalQueryRenderer} from '@/components/ui/conditional-query-renderer';
import {useGetPolicyRules} from '@/queries';
import {useAnalytics} from '@/hooks';

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const {analyticsTrack} = useAnalytics();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
                  {data?.rules?.length} Policy {data?.rules?.length && data?.rules?.length > 1 ? 'Rules' : 'Rule'}
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
                                  <Tag
                                    status={rule.needsApproval ? TagStatus.Positive : TagStatus.Negative}
                                    size={GeneralSize.Small}
                                  >
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
                        <Tooltip title="Actions" arrow>
                          <IconButton
                            sx={(theme) => ({
                              color: theme.palette.vars.baseTextDefault,
                              width: '24px',
                              height: '24px'
                            })}
                            onClick={handleClick}
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Menu
                          transformOrigin={{horizontal: 'right', vertical: 'top'}}
                          anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                          anchorEl={anchorEl}
                          open={open}
                          onClose={handleClose}
                          onClick={handleClose}
                        >
                          <MenuItem
                            key="edit-rule"
                            sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                            onClick={() => {
                              analyticsTrack('CLICK_EDIT_RULE_POLICY');
                              setTempRule(rule);
                              setIsEdit(true);
                            }}
                          >
                            <PencilIcon className="w-4 h-4" color="#062242" />
                            <Typography variant="body2" color="#1A1F27">
                              Edit
                            </Typography>
                          </MenuItem>
                          <MenuItem
                            key="delete-rule"
                            onClick={() => {
                              analyticsTrack('CLICK_DELETE_RULE_POLICY');
                              setTempRule(rule);
                              setIsDelete(true);
                            }}
                            sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
                          >
                            <Trash2Icon className="w-4 h-4" color="#C62953" />
                            <Typography variant="body2" color="#C0244C">
                              Delete
                            </Typography>
                          </MenuItem>
                        </Menu>
                      </div>
                      <div className="my-6">
                        <Divider />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Pagination
                      count={Number(data?.pagination?.total) || 0}
                      page={pageRules}
                      onChange={handlePaginationRulesChange}
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </ConditionalQueryRenderer>
        <OpsRule
          policy={policy}
          rule={tempRule}
          isDelete={isDelete}
          isEdit={isEdit}
          isAdd={isAdd}
          onClose={() => {
            setTempRule(undefined);
            setIsDelete(false);
            setIsEdit(false);
            setIsAdd(false);
          }}
        />
      </div>
    </>
  );
};
