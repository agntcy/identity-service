# Agent Identity Service UI

This repository contains all components of the Agent Identity Service UI - a React-based frontend application built with modern web technologies.

## 🚀 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Libraries**:
  - Outshift Spark Design
  - Material-UI (MUI)
  - Radix UI components
  - Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Okta Auth JS
- **Package Manager**: Yarn 4.9.2

### Testing Stack

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **DOM Testing**: @testing-library/dom
- **User Interactions**: @testing-library/user-event
- **Assertions**: @testing-library/jest-dom
- **Environment**: jsdom
- **Coverage**: Vitest Coverage (v8)

## 📋 Prerequisites

- Node.js >= 20
- Yarn (configured as package manager)
- NVM (Node Version Manager)
- Access to Cisco DevHub Cloud for Spark Design library

## 🔐 Authentication Setup for Spark Design Library

Before installing dependencies, you need to authenticate with Cisco's NPM registry to access the Outshift Spark Design library.

### 1. Generate DevHub Cloud Token

1. Go to [Outshift - NPM](https://artifactory.devhub-cloud.cisco.com/ui/repos/tree/General/outshift-npm)
2. Follow the instructions to generate a token for the `outshift-npm` repository
3. Store this token securely - you'll need it for npm login

### 2. Login to NPM Registry

```bash
npm login --registry=https://artifactory.devhub-cloud.cisco.com/artifactory/api/npm/outshift-npm/ --scope=@outshift --auth-type=web
```

**Credentials:**

- **Username**: Your Cisco username
- **Password**: The token generated in step 1

## 🛠 Development Setup

### 1. Setup Node.js Version

```bash
# Install NVM if you haven't already
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.bashrc

# Install and use the correct Node.js version
nvm install
nvm use
```

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd pyramid-saas/frontend

# Install dependencies
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure the following environment variables in your `.env` file.

### 4. Start Development Server

```bash
# Start the development server
yarn dev

# Alternative command
yarn start
```

The application will be available at `http://localhost:5500`

## 📜 Available Scripts

```bash
# Development
yarn dev              # Start development server
yarn start            # Alias for yarn dev

# Building
yarn build            # Build for production
yarn preview          # Preview production build

# Testing
yarn test             # Run tests
yarn test:coverage    # Run tests with coverage report
yarn test:watch       # Run tests in watch mode
yarn test:ui          # Run tests with UI interface

# Code Quality
yarn lint:check       # Check linting and formatting
yarn lint             # Fix linting and formatting issues
yarn format           # Format code with Prettier

# Utilities
yarn generate-bff     # Generate BFF types
yarn generate-pwa-assets  # Generate PWA assets
```

## 🏗 Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API services
│   ├── stores/       # Zustand stores
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── utils/            # Workspace utilities
└── package.json
```

## 🔧 Configuration Files

- **TypeScript**: `tsconfig.json`
- **Vite**: `vite.config.ts`
- **Tailwind**: `tailwind.config.js`
- **ESLint**: `eslint.config.js`
- **Prettier**: `.prettierrc`

## 🚀 Building for Production

```bash
# Build the application
yarn build

# Preview the production build locally
yarn preview
```

The built files will be in the `dist/` directory.

## 🧪 Testing

This project uses **Vitest** as the testing framework with comprehensive testing utilities.

### Running Tests

```bash
# Run all tests once
yarn test

# Run tests in watch mode (re-runs on file changes)
yarn test:watch

# Run tests with coverage report
yarn test:coverage

# Run tests with interactive UI
yarn test:ui
```

### Test Structure

Tests should be placed alongside components or in dedicated test directories:

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   └── ...
└── __tests__/          # Global test utilities
```

### Writing Tests

Example test structure:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Code Quality Checks

```bash
# Run linting checks
yarn lint:check

# Fix linting issues
yarn lint

# Format code
yarn format
```

## 📱 PWA Support

This application includes Progressive Web App (PWA) capabilities:

- Service Worker for offline functionality
- App manifest for installability
- Asset caching strategies

Generate PWA assets:

```bash
yarn generate-pwa-assets
```

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Run `yarn lint` before committing
3. Ensure all TypeScript types are properly defined
4. Test your changes thoroughly

## 📞 Support

For issues related to:

- **Spark Design Library**: Check Outshift documentation
- **Authentication**: Verify your DevHub Cloud access
- **Development**: Check this README or project
