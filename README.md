# 📚 Baca - Library Management API

A production-ready Library Management REST API built with **Express.js**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

## Features

- 🔐 **JWT Authentication** — Access + refresh token flow
- 👥 **Role-Based Access Control** — ADMIN, LIBRARIAN, MEMBER
- 📖 **Book Management** — Full CRUD with search
- 📋 **Loan System** — Borrow/return with business constraints
- 📄 **Swagger API Docs** — OpenAPI 3.0 at `/api/docs`
- 🐳 **Docker** — Full containerized deployment
- 🧪 **Integration Tests** — Jest + Supertest

## Tech Stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Runtime    | Node.js (LTS)                                |
| Framework  | Express.js                                   |
| Language   | TypeScript (strict)                          |
| Database   | PostgreSQL                                   |
| ORM        | Prisma                                       |
| Auth       | JWT (jsonwebtoken + bcrypt)                  |
| Validation | Zod                                          |
| Docs       | Swagger (swagger-jsdoc + swagger-ui-express) |
| Testing    | Jest + Supertest                             |
| Deploy     | Docker + Docker Compose                      |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Local Development

```bash
# Install dependencies
npm install

# Copy env and configure
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run prisma:seed

# Start dev server
npm run dev
```

### Docker

```bash
# Start all services
docker-compose up --build

# Stop
docker-compose down
```

## API Endpoints

### Auth

| Method | Endpoint                  | Description       | Auth |
| ------ | ------------------------- | ----------------- | ---- |
| POST   | `/api/auth/register`      | Register new user | -    |
| POST   | `/api/auth/login`         | Login             | -    |
| POST   | `/api/auth/refresh-token` | Refresh tokens    | -    |
| POST   | `/api/auth/logout`        | Logout            | ✅   |
| GET    | `/api/auth/me`            | Get profile       | ✅   |

### Users

| Method | Endpoint         | Description | Auth            |
| ------ | ---------------- | ----------- | --------------- |
| GET    | `/api/users`     | List users  | ADMIN/LIBRARIAN |
| GET    | `/api/users/:id` | Get user    | ADMIN/LIBRARIAN |
| PUT    | `/api/users/:id` | Update user | ADMIN           |
| DELETE | `/api/users/:id` | Delete user | ADMIN           |

### Books

| Method | Endpoint         | Description | Auth            |
| ------ | ---------------- | ----------- | --------------- |
| GET    | `/api/books`     | List books  | ✅              |
| GET    | `/api/books/:id` | Get book    | ✅              |
| POST   | `/api/books`     | Create book | ADMIN/LIBRARIAN |
| PUT    | `/api/books/:id` | Update book | ADMIN/LIBRARIAN |
| DELETE | `/api/books/:id` | Delete book | ADMIN/LIBRARIAN |

### Loans

| Method | Endpoint            | Description    | Auth            |
| ------ | ------------------- | -------------- | --------------- |
| POST   | `/api/loans/borrow` | Borrow book    | ✅              |
| POST   | `/api/loans/return` | Return book    | ✅              |
| GET    | `/api/loans`        | List all loans | ADMIN/LIBRARIAN |
| GET    | `/api/loans/my`     | My loans       | ✅              |

## Business Rules

- Max **3 active loans** per user
- Cannot borrow if book stock ≤ 0
- Stock decrements on borrow, increments on return
- Cannot borrow the same book twice (while active)

## API Documentation

Swagger UI available at: **`http://localhost:3000/api/docs`**

## Seed Users

| Role      | Email              | Password     |
| --------- | ------------------ | ------------ |
| ADMIN     | admin@baca.com     | admin123     |
| LIBRARIAN | librarian@baca.com | librarian123 |
| MEMBER    | member@baca.com    | member123    |

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Project Structure

```
baca-be/
├── src/
│   ├── app.ts                  # Express app setup
│   ├── server.ts               # Server entry point
│   ├── config/
│   │   ├── env.ts              # Zod-validated env config
│   │   └── database.ts         # Prisma client
│   ├── docs/
│   │   └── swagger.ts          # OpenAPI 3.0 config
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   ├── role.middleware.ts   # RBAC authorization
│   │   └── error.middleware.ts  # Global error handler
│   ├── modules/
│   │   ├── auth/               # Auth module
│   │   ├── users/              # Users module
│   │   ├── books/              # Books module
│   │   └── loans/              # Loans module
│   ├── utils/
│   │   ├── jwt.ts              # JWT utilities
│   │   └── hash.ts             # bcrypt utilities
│   ├── types/
│   │   └── index.ts            # Type definitions
│   └── tests/                  # Integration tests
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
├── Dockerfile
├── docker-compose.yml
├── jest.config.ts
├── tsconfig.json
└── package.json
```
