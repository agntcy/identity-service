# AGNTCY Identity Service Backend

This repository contains all components of the AGNTCY Identity Service Backend - a Golang-based backend service for managing agent identities.

## 🚀 Tech Stack

- **Backend**: Golang
- **Web Framework**: gRPC Gateway
- **Model**: Protocol Buffers (Protobuf)
- **Database**: PostgreSQL
- **ORM**: GORM
- **API**: gRPC and RESTful APIs
- **Authentication**: OIDC

### Testing Stack

Mockery, Testify

## 📋 Prerequisites

- Golang 1.26+

## 🛠 Development Setup

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.sample .env
```

Configure the following environment variables in your `.env` file:

#### Database Configuration

- `SECRETS_CRYPTO_KEY` - Key used for encrypting secrets
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: identity)
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_USE_SSL` - Use SSL for database connection (true/false)

#### Vault Configuration

- `KEY_STORE_TYPE` - Type of key store (vault or awssm)
- `VAULT_HOST` - Vault server host
- `VAULT_PORT` - Vault server port (default: 8200)
- `VAULT_USE_SSL` - Use SSL for Vault connection (true/false)

> **📝 NOTE**
> For AWS Secrets Manager, make sure you setup the variables below:

- `AWS_REGION` - AWS region for Secrets Manager

#### Identity Node Configuration

- `IDENTITY_HOST` - Identity service host
- `IDENTITY_PORT` - Identity service port

#### OIDC Authentication

- `IAM_ORGANIZATION` - Organization name
- `IAM_ISSUER` - OIDC issuer URL
- `IAM_USER_CID` - Client ID for OIDC authentication

#### PWA Notifications (Optional)

- `WEB_APPROVAL_EMAIL` - Email for web approval notifications
- `WEB_APPROVAL_PUB_KEY` - Public key for web approval notifications
- `WEB_APPROVAL_PRIV_KEY` - Private key for web approval notifications

### 2. Start Development Server

```bash
# Start the development server
cd backend/cmd/bff
go run .
```

- The REST APIs will be available at `http://localhost:4000`.
- The gRPC APIs will be available at `http://localhost:4001`.

## 🏗 Project Structure

```text
backend/
├── api/                # Protobuf definitions and generated code
├── cmd/                # Main applications for the project
│   └── bff/            # Backend for Frontend application
├── internal/           # Private application and library code
│   ├── bff/            # Application services and gRPC services
│   ├── core/           # Core business logic, types, and repositories
│   └── pkg/            # Shared packages
└── pkg/                # Public libraries and utilities
```

## 🧪 Testing

This project uses standard Go testing tools along with Testify and Mockery for unit and integration tests.

### Running Tests

```bash
# Run all tests once
go test ./...
```

### Code Quality Checks

```bash
# Run pre-commit checks
pre-commit run --all-files
```
