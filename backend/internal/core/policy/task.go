// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package policy

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"

	"github.com/outshift/identity-service/internal/core/badge/mcp"
	"github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/google/uuid"
)

type TaskService interface {
	UpdateOrCreateForAgent(ctx context.Context, appID, name string) (*types.Task, error)
	CreateForMCP(ctx context.Context, appID string, mcpSchema string) ([]*types.Task, error)
}

type taskService struct {
	mcpClient        mcp.DiscoveryClient
	policyRepository Repository
}

func NewTaskService(
	mcpClient mcp.DiscoveryClient,
	policyRepository Repository,
) TaskService {
	return &taskService{
		mcpClient:        mcpClient,
		policyRepository: policyRepository,
	}
}

func (s *taskService) UpdateOrCreateForAgent(
	ctx context.Context,
	appID, name string,
) (*types.Task, error) {
	tasks, err := s.policyRepository.GetTasksByAppID(ctx, appID)
	if err != nil {
		return nil, err
	}

	if len(tasks) > 0 {
		for _, task := range tasks {
			task.Name = fmt.Sprintf("Invoke Agent %s", name)
		}

		err = s.policyRepository.UpdateTasks(ctx, tasks...)
		if err != nil {
			return nil, err
		}

		return tasks[0], nil
	}

	task := &types.Task{
		ID:    uuid.NewString(),
		Name:  fmt.Sprintf("Invoke Agent %s", name),
		AppID: appID,
	}

	err = s.policyRepository.CreateTasks(ctx, task)
	if err != nil {
		return nil, err
	}

	return task, nil
}

func (s *taskService) CreateForMCP(
	ctx context.Context,
	appID string, mcpSchema string,
) ([]*types.Task, error) {
	var mcpServer *mcp.McpServer

	err := json.Unmarshal([]byte(mcpSchema), &mcpServer)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal MCP schema: %w", err)
	}

	existingTasks, err := s.policyRepository.GetTasksByAppID(ctx, appID)
	if err != nil {
		return nil, err
	}

	existingTasksByName := make(map[string]*types.Task)
	for _, task := range existingTasks {
		existingTasksByName[task.ToolName] = task
	}

	tasksToCreate := make([]*types.Task, 0)
	tasksToUpdate := make([]*types.Task, 0)
	tasksToDelete := make([]*types.Task, 0)
	result := make([]*types.Task, 0)

	for _, tool := range mcpServer.Tools {
		task := &types.Task{
			ID:          uuid.NewString(),
			Name:        tool.Name,
			Description: tool.Description,
			AppID:       appID,
			ToolName:    tool.Name,
		}

		if et, ok := existingTasksByName[tool.Name]; ok {
			task.ID = et.ID
			tasksToUpdate = append(tasksToUpdate, task)
		} else {
			tasksToCreate = append(tasksToCreate, task)
		}

		result = append(result, task)
	}

	for _, task := range existingTasks {
		toDelete := !slices.ContainsFunc(result, func(t *types.Task) bool {
			return t.ToolName == task.ToolName
		})
		if toDelete {
			tasksToDelete = append(tasksToDelete, task)
		}
	}

	err = s.policyRepository.CreateTasks(ctx, tasksToCreate...)
	if err != nil {
		return nil, err
	}

	err = s.policyRepository.UpdateTasks(ctx, tasksToUpdate...)
	if err != nil {
		return nil, err
	}

	err = s.policyRepository.DeleteTasks(ctx, tasksToDelete...)
	if err != nil {
		return nil, err
	}

	return result, nil
}
