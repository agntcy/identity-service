// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	app "github.com/agntcy/identity-platform/internal/core/app/postgres"
	"github.com/agntcy/identity-platform/internal/core/policy/types"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
)

type Task struct {
	ID          string `gorm:"primaryKey"`
	TenantID    string `gorm:"not null;type:varchar(256);index"`
	Name        string
	Description string
	AppID       string
	App         app.App `gorm:"foreignKey:AppID"`
	ToolName    string
	Rules       []*Rule `gorm:"many2many:rule_tasks;"`
}

func (t *Task) ToCoreType() *types.Task {
	return &types.Task{
		ID:          t.ID,
		Name:        t.Name,
		Description: t.Description,
		AppID:       t.AppID,
		ToolName:    t.ToolName,
	}
}

type Rule struct {
	ID            string `gorm:"primaryKey"`
	TenantID      string `gorm:"not null;type:varchar(256);index"`
	Name          string
	Description   string
	PolicyID      string
	Tasks         []*Task `gorm:"many2many:rule_tasks;"`
	NeedsApproval bool
}

func (r *Rule) ToCoreType() *types.Rule {
	return &types.Rule{
		ID:            r.ID,
		Name:          r.Name,
		Description:   r.Description,
		PolicyID:      r.PolicyID,
		NeedsApproval: r.NeedsApproval,
		Tasks: convertutil.ConvertSlice(r.Tasks, func(task *Task) *types.Task {
			return task.ToCoreType()
		}),
	}
}

type Policy struct {
	ID          string `gorm:"primaryKey"`
	TenantID    string `gorm:"not null;type:varchar(256);index"`
	Name        string
	Description string
	AssignedTo  string
	App         app.App `gorm:"foreignKey:AssignedTo"`
	Rules       []*Rule
}

func (p *Policy) ToCoreType() *types.Policy {
	return &types.Policy{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		AssignedTo:  p.AssignedTo,
		Rules: convertutil.ConvertSlice(p.Rules, func(rule *Rule) *types.Rule {
			return rule.ToCoreType()
		}),
	}
}

func newPolicyModel(src *types.Policy, tenantID string) *Policy {
	return &Policy{
		ID:          src.ID,
		TenantID:    tenantID,
		Name:        src.Name,
		Description: src.Description,
		AssignedTo:  src.AssignedTo,
		Rules: convertutil.ConvertSlice(src.Rules, func(rule *types.Rule) *Rule {
			return NewRuleModel(rule, tenantID)
		}),
	}
}

func NewRuleModel(src *types.Rule, tenantID string) *Rule {
	return &Rule{
		ID:            src.ID,
		TenantID:      tenantID,
		Name:          src.Name,
		Description:   src.Description,
		PolicyID:      src.PolicyID,
		NeedsApproval: src.NeedsApproval,
		Tasks: convertutil.ConvertSlice(src.Tasks, func(task *types.Task) *Task {
			return newTaskModel(task, tenantID)
		}),
	}
}

func newTaskModel(src *types.Task, tenantID string) *Task {
	return &Task{
		ID:       src.ID,
		TenantID: tenantID,
		Name:     src.Name,
		AppID:    src.AppID,
		ToolName: src.ToolName,
	}
}
