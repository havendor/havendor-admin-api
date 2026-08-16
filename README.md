# Havendor Admin API (`havendor-admin-api`)

> **Core Platform Management & Multi-Tenant Orchestration API**  
> Part of the [Havendor](https://havendor.com) E-Commerce & SaaS Ecosystem.

---

## 🤖 AI Agent Quick Reference & Context

This README is designed to provide human developers and **AI Coding Agents** (Antigravity, Cursor, GitHub Copilot, Claude) with an immediate, high-fidelity understanding of the codebase structure, execution contracts, database workflows, and conventions.

### ⚡ Critical Rules for AI Agents

1. **ESM Module System**: The project uses native ES Modules (`"type": "module"` in `package.json`). All local relative imports **MUST** include the explicit `.js` file extension (e.g., `import { APP_CONFIG } from "./config/index.js";`).
2. **Prisma Client Path**: The generated Prisma client is customized to output at `src/generated/prisma`. Import Prisma client from `@prisma/client` or relative generated client path, and ensure postbuild sync (`node ./scripts/copy-prisma-client.cjs`) is executed during compilation.
3. **Private Package Registry**: Uses private packages `@havendor/server-core` and `@havendor/types` hosted on GitHub Packages. Authentication via `.npmrc` is strictly required before running `npm install`.
4. **Field Encryption**: Sensitive fields (e.g., database connection credentials) must be encrypted using `AES-256-GCM` with `ENCRYPTION_KEY` via `src/utility/field-crypto.ts`.
5. **Permissions Catalog**: Admin actions are governed by strict RBAC permissions defined in `src/const/permissions.ts`. Always verify required permissions before creating new admin routes.

---

## 🚀 Tech Stack & Core Libraries

- **Runtime & Language**: Node.js (ESM), TypeScript `^6.0`
- **Framework**: Express.js `^5.2`
- **Database & ORM**: PostgreSQL, Prisma ORM `^7.8` (with `@prisma/adapter-pg`)
- **Caching & Key-Value**: Redis (`redis` v5)
- **Shared Libraries**: `@havendor/server-core`, `@havendor/types`
- **Validation**: Zod `^4.3`
- **Security & Crypto**: Helmet, Cors, Compression, Cookie-Parser, BcryptJS, AES-256-GCM
- **Payment Providers**: Stripe API `^22.4`, SSLCommerz (IPN / Webhooks), Manual Verification
- **Development Tooling**: Nodemon, `tsx`, `tsc-esm-fix`, ESLint 10, Prettier, Husky, Lint-Staged

---

## 📂 Project Architecture & Directory Structure

The project follows a **Feature-Sliced / Modular Architecture** with clear separation between routes, controllers, services, DTO validations, and shared utilities:

```
havendor-admin-api/
├── .env.example               # Complete environment variable template
├── .npmrc                     # GitHub Package registry configuration (git-ignored)
├── Dockerfile                 # Container deployment definition
├── nodemon.json               # Development live-reload config
├── prisma.config.ts           # Prisma config with dotenv support
├── prisma/
│   └── schema.prisma          # Comprehensive Prisma database schema
├── scripts/
│   └── copy-prisma-client.cjs # Post-build script syncing generated Prisma client
└── src/
    ├── app.ts                 # Express app configuration & middleware pipeline
    ├── server.ts              # Entry point: DB connection, Redis & HTTP server startup
    ├── seed-runner.ts         # Seeding script entrypoint
    ├── config/
    │   └── APP_CONFIG.ts       # Zod-validated application & core configuration
    ├── const/
    │   ├── actions.ts         # Shared constant definitions
    │   └── permissions.ts     # RBAC permissions registry (ALL_PERMISSIONS)
    ├── middleware/
    │   ├── adminAuthGuard.ts  # Admin JWT authentication & permission verification guard
    │   ├── tenantAuthGuard.ts # Tenant JWT authentication guard
    │   ├── enableCors.ts      # Configured CORS policy middleware
    │   └── catchAsync.ts      # Async controller error wrapper
    ├── modules/
    │   ├── admin/             # Admin management domain modules
    │   │   ├── admin/         # Admin profile & system user CRUD
    │   │   ├── auth/          # Admin login, logout, refresh, password reset
    │   │   ├── payment/       # Payment manual verification & auditing
    │   │   ├── payment-method/# Catalog of payment gateways (manual + automated)
    │   │   ├── role/          # RBAC roles & permission assignment
    │   │   ├── shop/          # Shop approval, suspension & provisioning
    │   │   ├── subscription/  # Shop subscription monitoring & blocking
    │   │   └── tenant/        # Tenant management & account lifecycle
    │   ├── tenant/            # Tenant portal submodules
    │   │   ├── auth/          # Tenant authentication & session handling
    │   │   ├── payment/       # Tenant payment checkout & invoices
    │   │   ├── plan/          # Available subscription plan catalog
    │   │   └── shop/          # Tenant shop management
    │   ├── payment/           # Payment gateway providers (Stripe, SSLCommerz, Manual)
    │   ├── webhooks/          # Webhook receivers (Stripe Raw Body, SSLCommerz IPN)
    │   └── internal/          # Service-to-service internal API handlers
    ├── routes/
    │   ├── index.ts           # Route module exporter
    │   ├── admin-routes.ts    # Mounts /v1/admin routes with rate limiting
    │   ├── tenant-routes.ts   # Mounts /v1/tenant routes with rate limiting
    │   └── internal-routes.ts # Mounts /v1/internal routes
    ├── utility/
    │   ├── field-crypto.ts    # AES-256-GCM encryption for credentials
    │   ├── prisma.ts          # Singleton PrismaClient instance
    │   ├── route-rate-config.ts# Per-route Redis/memory rate limiting rules
    │   ├── dbQueryWithPagination.ts # Standardized paginated DB query wrapper
    │   └── createAdminEmployeeId.ts # Unique employee ID generator
    └── seed/                  # Initial data seeders (Permissions, Roles, Admins)
```

---

## 🛠️ Setup & Installation

### 1. Private GitHub Package Authentication

This project depends on private GitHub packages (`@havendor/server-core` & `@havendor/types`). Before installing dependencies:

1. Create a GitHub Personal Access Token (PAT) with `read:packages` scope at **GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**.
2. Create a `.npmrc` file in the project root:
   ```ini
   @havendor:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT_HERE
   ```
   > ⚠️ **Note**: `.npmrc` is git-ignored — never commit your token to source control. Alternatively, set the `NPM_TOKEN` environment variable.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your database, Redis, and secret parameters:

```bash
cp .env.example .env
```

Key required variables in `.env`:

- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_CACHE_URL`, `REDIS_RATE_LIMIT_URL`, `REDIS_QUEUE_URL`: Redis connection URLs for Cache, Rate Limiting, and Queues.
- `ENCRYPTION_KEY`: 64-byte hex string (must match across Havendor services).
- `INTERNAL_SERVICE_SECRET`: Secret string for internal service requests.
- `JWT_SECRET`: Secret key for JWT signing.
- `SMTP_*`: Email server parameters.
- `S3_*`: Object storage credentials for image/document uploads.

---

## 🗄️ Database Management & Workflow

This project uses Prisma ORM with custom client output located at `src/generated/prisma`.

### Commands

| Command               | Description                                                          |
| :-------------------- | :------------------------------------------------------------------- |
| `npm run db:push`     | Push schema changes directly to the target database                  |
| `npm run db:seed`     | Execute seeding scripts (initializes permissions and admin defaults) |
| `npm run db:studio`   | Open interactive Prisma Studio GUI to view/edit database records     |
| `npx prisma generate` | Regenerate the Prisma Client in `src/generated/prisma`               |

---

## 🚦 Available API Endpoints & Routes

All routes are mounted under the base path configured by `PATH_PREFIX` (default: `/api-server`).

### API Prefix: `/api-server/v1`

| Route Prefix                | Access Level                | Responsibilities                                      |
| :-------------------------- | :-------------------------- | :---------------------------------------------------- |
| `/v1/admin/auth`            | Public / Admin              | Admin login, refresh token, password reset            |
| `/v1/admin/admin`           | Admin (`READ_ADMIN`, etc.)  | Admin user CRUD, termination, activation              |
| `/v1/admin/role`            | Admin (`READ_ROLE`, etc.)   | Role & permission management                          |
| `/v1/admin/tenant`          | Admin (`READ_TENANT`, etc.) | Tenant account administration & audit                 |
| `/v1/admin/payment-methods` | Admin (`PAYMENT_METHOD`)    | Manage automated and manual payment options           |
| `/v1/admin/payments`        | Admin (`PAYMENT`)           | Review and manually verify tenant payments            |
| `/v1/admin/subscriptions`   | Admin (`SUBSCRIPTION`)      | Monitor and block/unblock shop subscriptions          |
| `/v1/tenant/auth`           | Public / Tenant             | Tenant login, registration, session management        |
| `/v1/tenant/plans`          | Public / Tenant             | View active platform subscription plans               |
| `/v1/tenant/payments`       | Tenant                      | Initiate checkout (Stripe/SSLCommerz/Manual)          |
| `/v1/webhooks/stripe`       | Public (Raw Body)           | Handles Stripe payment intent & invoice webhooks      |
| `/v1/webhooks/sslcommerz`   | Public                      | Handles SSLCommerz IPN callbacks                      |
| `/v1/internal/*`            | Service-to-Service          | Internal microservice communication guarded by secret |

---

## 📜 Build & Scripts Reference

| Command                | Description                                                       |
| :--------------------- | :---------------------------------------------------------------- |
| `npm run dev`          | Start development server with live reload via Nodemon             |
| `npm run build`        | Compile TypeScript, fix ESM imports, and sync Prisma client build |
| `npm run build:vercel` | Build pipeline tailored for Vercel deployments                    |
| `npm start`            | Run compiled production server from `dist/server.js`              |

---

## 🛡️ Security & Authentication Overview

- **Dual Session System**: Supports distinct authentication states for `Admin` users and `Tenant` users.
- **Cookies & Headers**: Refresh tokens are stored in secure cookies (`a_refresh_token` for Admin, `t_refresh_token` for Tenant, with `__Host-` prefixes in production). Access tokens are transmitted via standard `Authorization: Bearer <token>` headers.
- **RBAC Engine**: Admin authorization uses fine-grained permissions attached to roles. Verification is performed in `adminAuthGuard.ts`:
  ```ts
  adminAuthGuard(PERMISSIONS.ADMIN.READ);
  ```
- **Internal Service Auth**: Microservice requests must supply `x-internal-service-secret` matching `INTERNAL_SERVICE_SECRET`.
