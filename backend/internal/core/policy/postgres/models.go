// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"database/sql"
	"time"

	app "github.com/agntcy/identity-service/internal/core/app/postgres"
	"github.com/agntcy/identity-service/internal/core/policy/types"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/pgutil"
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
	Tasks         []*Task          `gorm:"many2many:rule_tasks;"`
	Action        types.RuleAction `json:"action,omitempty"`
	NeedsApproval bool
	CreatedAt     time.Time
	UpdatedAt     sql.NullTime
}

func (r *Rule) ToCoreType() *types.Rule {
	return &types.Rule{
		ID:            r.ID,
		Name:          r.Name,
		Description:   r.Description,
		PolicyID:      r.PolicyID,
		Action:        r.Action,
		NeedsApproval: r.NeedsApproval,
		Tasks: convertutil.ConvertSlice(r.Tasks, func(task *Task) *types.Task {
			return task.ToCoreType()
		}),
		CreatedAt: r.CreatedAt,
		UpdatedAt: pgutil.SqlNullTimeToTime(r.UpdatedAt),
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
	CreatedAt   time.Time
	UpdatedAt   sql.NullTime
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
		CreatedAt: p.CreatedAt,
		UpdatedAt: pgutil.SqlNullTimeToTime(p.UpdatedAt),
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
		CreatedAt: src.CreatedAt,
		UpdatedAt: pgutil.TimeToSqlNullTime(src.UpdatedAt),
	}
}

func NewRuleModel(src *types.Rule, tenantID string) *Rule {
	return &Rule{
		ID:            src.ID,
		TenantID:      tenantID,
		Name:          src.Name,
		Description:   src.Description,
		PolicyID:      src.PolicyID,
		Action:        src.Action,
		NeedsApproval: src.NeedsApproval,
		Tasks: convertutil.ConvertSlice(src.Tasks, func(task *types.Task) *Task {
			return newTaskModel(task, tenantID)
		}),
		CreatedAt: src.CreatedAt,
		UpdatedAt: pgutil.TimeToSqlNullTime(src.UpdatedAt),
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
