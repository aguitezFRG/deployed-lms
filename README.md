# Library Management System Demo

This repository contains a static, browser-only library management demonstration in [`LMS/`](LMS/). It preserves the primary catalog, copy, access-request, user-management, audit, notification, and analytics workflows without requiring PHP, a database, or external services.

## Quick start

Requirements: Node.js 20 or later and npm.

```bash
cd LMS
npm install
npm run dev
```

Open the URL printed by Vite and sign in with any seeded account. Every account uses the password `P4ssword@123`.

## Verification

Run these commands from `LMS/`:

```bash
npm test          # Vitest unit and component tests
npm run test:e2e # Playwright browser workflows
npm run lint     # TypeScript validation
npm run build    # Production build in dist/
```

## Deployment

For Vercel, set the project root to `LMS`. The application requires no environment variables or backend services. See the [application documentation](LMS/README.md) for accounts, role permissions, storage behavior, architecture, testing, and deployment details.
