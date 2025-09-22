# Agent Identity Service UI

This repository contains all components of the Agent Identity Service UI - a React-based frontend application built with modern web technologies.

## 🚀 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Libraries**:
  - Open UI Kit Core
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

## � UI Component Library

This project uses [Open UI Kit Core](https://www.npmjs.com/package/@open-ui-kit/core) - a modern, accessible component library available on npm.

**Installation**: The Open UI Kit Core package is publicly available and will be installed automatically with the project dependencies.

```bash
# Installed automatically with project dependencies
yarn install
```

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
cd identity-service/frontend

# Install dependencies
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.sample .env
```

Configure the following environment variables in your `.env` file:

#### App Configuration

- `VITE_NODE_ENV` - Environment mode (development, production, etc.)
- `VITE_API_URL` - Backend API base URL
- `VITE_APP_CLIENT_PORT` - Port for the frontend application (default: 5500)
- `VITE_APP_LOG_LEVEL` - Logging level for the application
- `VITE_DOCS_URL` - URL for application documentation
- `VITE_APP_BASE_NAME` - Base name/path for the application routing
- `VITE_AUTH_TYPE` - Authentication method to use (values: `iam`, `oidc`)

#### IAM Authentication

- `VITE_IAM_PRODUCT_ID` - Product identifier for IAM integration
- `VITE_IAM_UI` - IAM UI service URL
- `VITE_IAM_API` - IAM API service URL
- `VITE_IAM_OIDC_CLIENT_ID` - OIDC client ID for authentication
- `VITE_IAM_OIDC_ISSUER` - OIDC issuer URL
- `VITE_IAM_MULTI_TENANT` - Enable multi-tenant support (true/false)

#### Secondary OIDC Provider

- `VITE_OIDC_UI` - Secondary OIDC provider user interface URL
- `VITE_OIDC_CLIENT_ID` - OAuth 2.0/OIDC client identifier for secondary authentication provider
- `VITE_OIDC_ISSUER` - OAuth 2.0/OIDC issuer URL for secondary authentication provider

#### Analytics

- `VITE_SEGMENT_ID` - Segment analytics tracking ID
- `VITE_MAZE_ID` - Maze analytics tracking ID

#### Authentication Configuration

The application uses default authentication configuration options defined in `src/constants/okta.ts`. These default options apply to both IAM and OIDC authentication providers:

```typescript
export const defaultAuthConfigOptions: AuthConfigOptions = {
  scopes: ['openid', 'offline_access'],
  renew: 'auto',
  redirectUri: `${window.location.protocol}//${window.location.host}`,
  devMode: false,
  renewOnTabActivation: true,
  tabInactivityDuration: 1800, // 30 minutes
  syncStorage: true
};
```

These options control:

- **scopes**: OAuth 2.0 scopes requested during authentication
- **renew**: Token renewal strategy ('auto' for automatic renewal)
- **redirectUri**: URI to redirect to after authentication
- **devMode**: Development mode flag for additional debugging
- **renewOnTabActivation**: Whether to renew tokens when tab becomes active
- **tabInactivityDuration**: Time in seconds before considering tab inactive
- **syncStorage**: Whether to synchronize authentication state across browser tabs

### 4. Global Configuration Setup

Configure the application's global settings by editing `src/config/global.ts`:

```typescript
export const globalConfig = {
  pwa: {
    name: 'Your App Name', // Replace with your application name
    shortName: 'Short Name', // Replace with a short version of your app name
    description: 'Your app description here', // Replace with your app description
    themeColor: '#eff3fc', // Customize theme color
    backgroundColor: '#eff3fc' // Customize background color
  },
  links: {
    termsAndConditions: 'https://your-terms-url.com', // Update with your terms URL
    privacyPolicy: 'https://your-privacy-policy-url.com', // Update with your privacy policy URL
    email: 'support@yourcompany.com' // Update with your support email
  },
  company: {
    name: 'Your Company Name', // Replace with your company name
    url: 'https://yourcompany.com/', // Replace with your company URL
    gitHub: 'https://github.com/yourcompany' // Replace with your GitHub URL
  },
  title: 'Your App Name', // Replace with your application name
  description: 'Your app description here' // Replace with your app description
};
```

**Important**: Remove any `<place-holder>` text and update all URLs, email addresses, and company information to match your actual application requirements.

### 5. Generate PWA Assets (Logo Setup)

> **⚠️ IMPORTANT**  
> After cloning the repository and configuring your settings, generate the PWA assets from your logo. This step sets up all the necessary icons and splash screens for your app.

```bash
# Generate PWA assets from the logo.svg file
yarn generate-pwa-assets
```

This script will:

- Generate all required PWA icons (favicon, apple-touch-icon, etc.)
- Create properly sized assets from your `public/logo.svg` file
- Set up the visual identity for your Progressive Web App

> **📝 NOTE**  
> Make sure you have your custom logo as `public/logo.svg` before running this command.

### 6. Start Development Server

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
│   ├── config/       # Configuration files (global.ts)
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
- **Global Config**: `src/config/global.ts`

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
5. Update `global.ts` configuration when adding new global settings

## 📞 Support

For issues related to:

- **Spark Design Library**: Check GitHub Packages Registry access
- **Authentication**: Verify your GitHub Personal Access Token
- **Development**: Check this README
