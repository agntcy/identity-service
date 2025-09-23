// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
)

type AwsSmCredentialStore struct {
	client        *secretsmanager.Client
	kmsKeyID      *string
	secretsPrefix string
}

func NewAwsSmCredentialStore(
	cfg *aws.Config,
	kmsKeyID *string,
	secretsPrefix string,
) (CredentialStore, error) {
	if cfg == nil {
		return nil, errors.New("please provide a configuration for the AWS SM client")
	}

	return &AwsSmCredentialStore{
		client:        secretsmanager.NewFromConfig(*cfg),
		kmsKeyID:      kmsKeyID,
		secretsPrefix: secretsPrefix,
	}, nil
}

func (s *AwsSmCredentialStore) Get(
	ctx context.Context,
	subject string,
) (*ClientCredentials, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	out, err := s.client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: ptrutil.Ptr(s.getSecretPath(tenantID, subject)),
	})
	if err != nil {
		return nil, fmt.Errorf("unable to get client credentials from vault: %w", err)
	}

	if out == nil || len(out.SecretBinary) == 0 {
		return nil, ErrCredentialNotFound
	}

	var cred ClientCredentials

	err = json.Unmarshal(out.SecretBinary, &cred)
	if err != nil {
		return nil, fmt.Errorf("unable to unmarshal credentials: %w", err)
	}

	return &cred, nil
}

func (s *AwsSmCredentialStore) Put(
	ctx context.Context,
	cred *ClientCredentials,
	subject string,
) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	raw, err := json.Marshal(cred)
	if err != nil {
		return fmt.Errorf("unable to marshal credentials: %w", err)
	}

	_, err = s.client.CreateSecret(ctx, &secretsmanager.CreateSecretInput{
		Name:         ptrutil.Ptr(s.getSecretPath(tenantID, subject)),
		KmsKeyId:     s.kmsKeyID,
		SecretBinary: raw,
	})
	if err != nil {
		return fmt.Errorf("unable to store client credentials: %w", err)
	}

	return nil
}

func (s *AwsSmCredentialStore) Delete(ctx context.Context, subject string) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	_, err := s.client.DeleteSecret(ctx, &secretsmanager.DeleteSecretInput{
		SecretId: ptrutil.Ptr(s.getSecretPath(tenantID, subject)),
	})
	if err != nil {
		return fmt.Errorf("unable to delete client credentials: %w", err)
	}

	return nil
}

func (s *AwsSmCredentialStore) getSecretPath(tenantID, subject string) string {
	return fmt.Sprintf(
		"%s/%s/%s/%s",
		s.secretsPrefix,
		mountPath,
		tenantID,
		subject,
	)
}
