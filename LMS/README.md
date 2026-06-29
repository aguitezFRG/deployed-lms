# Library Management System Demo

A responsive React and TypeScript single-page application that demonstrates library catalog, copy, request, account, audit, notification, and analytics workflows. It is designed for static deployment and stores all demo state in the browser.

This is a functional demonstration, not a production security boundary. Accounts, passwords, permissions, and data are visible to the browser and are intentionally isolated to each browser profile.

## Technology

- React 19 and TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Lucide icons
- Vitest and React Testing Library
- Playwright

The interface uses a generic blue-and-white palette with semantic colors declared in `src/index.css`. Its layout is informed by the repository's `.feature-screenshots/` references, but it contains no university names, seals, logos, favicons, colors, or protected documents.

## Installation and development

Requirements: Node.js 20 or later and npm.

```bash
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Demo accounts

All accounts use `P4ssword@123`.

| Role        | Email                     | Capabilities                                                    |
| ----------- | ------------------------- | --------------------------------------------------------------- |
| Super Admin | `superadmin@library.demo` | Full material, copy, request, user, audit, and analytics access |
| Committee   | `committee@library.demo`  | Manage materials, users, requests, audits, and analytics        |
| IT Admin    | `itadmin@library.demo`    | Manage materials, users, requests, audits, and analytics        |
| Custodian   | `custodian@library.demo`  | Manage physical copies and physical-borrow workflows            |
| Faculty     | `faculty@library.demo`    | Browse permitted materials and manage personal requests         |
| Student     | `student@library.demo`    | Browse student-level materials and manage personal requests     |

## Application routes

| Route            | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `/login`         | Demo account authentication                    |
| `/dashboard`     | Role-aware summary and recent activity         |
| `/catalog`       | Search and filter accessible materials         |
| `/catalog/:id`   | Material details and access requests           |
| `/materials`     | Material and copy management                   |
| `/requests`      | Personal request history or staff review queue |
| `/users`         | Account status management                      |
| `/audit-logs`    | Immutable activity history                     |
| `/notifications` | User-specific workflow notifications           |
| `/analytics`     | Collection and usage summaries                 |

Protected routes redirect signed-out users to `/login`. Management routes also enforce role checks in the client application.

## Workflow behavior

- Catalog visibility follows each account's access level.
- Faculty and students can request available physical or digital copies.
- Users can cancel their own pending requests.
- Super Admin, Committee, and IT Admin accounts can approve or reject requests.
- Custodians can review eligible physical-copy requests.
- Approving a physical request marks its copy unavailable.
- Returning a physical copy restores its availability.
- Digital approvals do not change copy availability.
- Mutations automatically create audit records and relevant notifications.
- Audit records cannot be edited through the application.

## Browser storage

The versioned application state is stored at:

```text
localStorage["library-demo:v1"]
```

The authenticated account ID is stored for the current tab session at:

```text
sessionStorage["library-demo:session"]
```

Missing, corrupt, or incompatible stored state is replaced with deterministic seed data. Select **Reset demo data** from the navigation drawer to restore the original users, catalog, copies, requests, audit records, and notifications.

## Testing and production build

```bash
npm test          # Unit and component tests
npm run test:e2e # Student submission and administrator approval/return workflows
npm run lint     # TypeScript project validation
npm run build    # Type-check and generate dist/
```

Playwright requires its managed Chromium installation:

```bash
npx playwright install chromium
```

The test suite covers authentication, storage initialization and reset, authorization, access-level filtering, request transitions, copy availability, audit generation, route protection, credential errors, and primary browser workflows.

## Vercel deployment

1. Import the repository into Vercel.
2. Set **Root Directory** to `LMS`.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.
5. Deploy without environment variables.

`vercel.json` rewrites all application paths to `index.html`, allowing nested routes to load and refresh directly.

## Deliberate exclusions

The demo has no backend endpoints, PHP runtime, database, OAuth, uploads, document streaming, PDF watermarking, profile editing, onboarding, exports, secrets, or shared multi-user state. Browser-side authentication and authorization are demonstrative and must not be treated as production access controls.
