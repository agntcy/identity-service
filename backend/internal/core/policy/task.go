// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package policy

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"

	"github.com/agntcy/identity-service/internal/core/badge/mcp"
	"github.com/agntcy/identity-service/internal/core/policy/types"
	"github.com/google/uuid"
)

type TaskService interface {
	UpdateOrCreateForAgent(ctx context.Context, appID, name string) (*types.Task, error)
	CreateForMCP(ctx context.Context, appID string, mcpSchema string) ([]*types.Task, error)
}

type taskService struct {
	taskRepository TaskRepository
}

func NewTaskService(
	taskRepository TaskRepository,
) TaskService {
	return &taskService{
		taskRepository: taskRepository,
	}
}

func (s *taskService) UpdateOrCreateForAgent(
	ctx context.Context,
	appID, name string,
) (*types.Task, error) {
	tasks, err := s.taskRepository.GetByAppID(ctx, appID)
	if err != nil {
		return nil, fmt.Errorf("repository failed to fetch tasks for app %s: %w", appID, err)
	}

	if len(tasks) > 0 {
		for _, task := range tasks {
			task.Name = fmt.Sprintf("Invoke Agent %s", name)
		}

		err = s.taskRepository.Update(ctx, tasks...)
		if err != nil {
			return nil, fmt.Errorf("repository failed to update tasks for app %s: %w", appID, err)
		}

		return tasks[0], nil
	}

	task := &types.Task{
		ID:    uuid.NewString(),
		Name:  fmt.Sprintf("Invoke Agent %s", name),
		AppID: appID,
	}

	err = s.taskRepository.Create(ctx, task)
	if err != nil {
		return nil, fmt.Errorf("repository failed to create tasks for app %s: %w", appID, err)
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

	existingTasks, err := s.taskRepository.GetByAppID(ctx, appID)
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

	err = s.taskRepository.Create(ctx, tasksToCreate...)
	if err != nil {
		return nil, err
	}

	err = s.taskRepository.Update(ctx, tasksToUpdate...)
	if err != nil {
		return nil, err
	}

	err = s.taskRepository.Delete(ctx, tasksToDelete...)
	if err != nil {
		return nil, err
	}

	return result, nil
}
