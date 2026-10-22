# Ed-tech LMS Server

A production-oriented REST API for an Ed-Tech Learning Management System built with **NestJS 11**, **TypeScript**, **Prisma 7**, and **PostgreSQL**. It covers authentication, course management, enrollments with seat accounting, attendance, complaints, role-based access control, soft deletes, structured logging, and interactive API documentation via Swagger.

## Features

- **Authentication & Authorization** – JWT access/refresh tokens with support for `accessToken`/`refreshToken` cookies or `Authorization: Bearer` headers. Guards for route protection and role-based access (`ADMIN`, `EDUCATOR`, `STUDENT`).
- **User Management** – Profile CRUD, admin user listing with filters, and safe account soft-deletion with cleanup of related enrollments/complaints.
- **Course Management** – Course CRUD, educator assignment, search/pagination, soft deletes, and prevention of deletion while students are actively enrolled.
- **Enrollments & Seat Accounting** – Atomic seat reservation with `enrollmentCount` tracking, automatic counter decrement on dropout/removal/user deletion, and guards against enrolling in removed/full courses.
- **Attendance** – Per-course attendance records tied to enrollments with role-scoped access.
- **Complaints** – Student–educator complaint flow with statuses (`PENDING`, `PROCESSING`, `RESOLVED`), admin resolution (`WARNED`/`REMOVED`), and automatic seat/release logic on resolution.
- **Soft Deletes** – `removedAt` on `User`, `Course`, `Enrollment`, `Attendance`, and `Complaint` with consistent filtering across the service layer.
- **Robust Error Handling** – Global exception filter with a shared error envelope, Prisma error mapping, and domain-specific error codes.
- **Validation & Security** – `class-validator` with whitelist/forbidNonWhitelisted, CORS configuration, secure HTTP-only cookies, and structured request logging with `pino`.
- **API Documentation** – Interactive Swagger UI at `/api/v1/docs` (non-production) with bearer/cookie auth schemes and full DTO schemas.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [NestJS 11](https://docs.nestjs.com/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| ORM | [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg` |
| Database | [PostgreSQL](https://www.postgresql.org/) |
| Auth | [Passport.js](http://www.passportjs.org/) + [JWT](https://github.com/auth0/node-jsonwebtoken) |
| Validation | [class-validator](https://github.com/typestack/class-validator), [class-transformer](https://github.com/typestack/class-transformer) |
| Logging | [nestjs-pino](https://github.com/iamolegga/nestjs-pino), [pino](https://getpino.io/) |
| Docs | [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction) |

## Project Structure

```text
src/
├── app.controller.ts / app.service.ts / app.module.ts
├── main.ts
├── common/
│   ├── decorators/        # @GetUser, @Roles
│   ├── dto/               # Shared response/query DTOs
│   ├── errors/            # Domain exceptions, error codes, filters, mappers
│   ├── guards/            # JWT & Roles guards
│   ├── helpers/           # Shared utilities (release-seats)
│   ├── middlewares/       # Request ID middleware
│   └── swagger/           # Swagger setup & decorators
└── modules/
    ├── auth/              # Auth, strategies, guards
    ├── user/              # Users
    ├── courses/           # Courses
    ├── enrollment/        # Enrollments
    ├── attendance/        # Attendance
    ├── complaints/        # Complaints
    └── prisma/            # Prisma service/module
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/) database (e.g. [Neon](https://neon.tech/))

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

# JWT
JWT_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# App
PORT=3000
NODE_ENV=development
```

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio
npx prisma studio
```

## Running the App

```bash
# Development (watch mode)
npm run start:dev

# Development (standard)
npm run start

# Debug mode
npm run start:debug

# Production build
npm run build

# Production
npm run start:prod
```

The API is served with the global prefix `api/v1`. 

## API Documentation

When running in non-production environments, interactive docs are available at:

- **Swagger UI**: [`http://localhost:3000/api/v1/docs`](http://localhost:3000/api/v1/docs)
- **OpenAPI JSON**: [`http://localhost:3000/api/v1/docs-json`](http://localhost:3000/api/v1/docs-json)

Authentication can be tested via the `accessToken` cookie or `Authorization: Bearer <token>`.

## API Overview

| Module | Base Path | Description |
| --- | --- | --- |
| Auth | `/api/v1/auth` | Register/login, token refresh, logout, educator registration (admin only) |
| Users | `/api/v1/users` | Self-service profile, admin user management |
| Courses | `/api/v1/courses` | Course catalog, educator courses, admin CRUD, student lists |
| Enrollments | `/api/v1/enrollment` | Enroll/dropout, course enrollments, admin management |
| Attendance | `/api/v1/attendance` | Student/educator/admin attendance views |
| Complaints | `/api/v1/complaints` | File, view, process, and resolve complaints |

## Scripts

```bash
# Lint
npm run lint

# Format
npm run format

# Unit tests
npm run test

# Watch tests
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Notes

- **Soft deletes**: Deleted entities are hidden from standard queries and can be cleaned up by admin flows.
- **Seat consistency**: Seat counts are maintained atomically; mismatches are detected and rejected with explicit errors.
- **Re-enrollment**: Re-enrolling after a dropout is currently blocked by existing unique constraints — tracked as a known limitation.
- **Production safety**: Swagger is disabled when `NODE_ENV=production`, and internal errors are sanitized by the global exception filter.

## License

UNLICENSED
