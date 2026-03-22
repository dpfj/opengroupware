# OpenGroupware

Open-source groupware application built with Go backend and Next.js frontend.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

OpenGroupware is a full-stack open-source groupware solution that provides essential collaboration features including authentication, electronic approval, file management, notices, messenger, and calendar functionality.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Next.js 15 Frontend (Web)           │
│  React 19 + TanStack Query + Zustand + SSE │
├─────────────────────────────────────────────┤
│              HTTP/REST API                  │
├─────────────────────────────────────────────┤
│         Go Backend (groupware-sdk)          │
│      Gin + JWT + In-Memory Storage          │
├──────┬──────┬─────────┬──────────┬──────────┤
│ Auth │Approv│ File    │ Message  │ Calendar │
├──────┴──────┴─────────┴──────────┴──────────┤
│         Domain Models & Services            │
├─────────────────────────────────────────────┤
│    Infrastructure (Future: PostgreSQL)      │
└─────────────────────────────────────────────┘
```

## Tech Stack

### Backend (groupware-sdk)
- **Language**: Go 1.24+
- **Framework**: Gin
- **Authentication**: JWT
- **Logging**: Zap (structured logging)
- **Storage**: In-memory (PostgreSQL planned)

### Frontend (groupware-web)
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Form Management**: React Hook Form
- **Schema Validation**: Zod
- **Real-time**: Server-Sent Events (SSE)

## Project Structure

```
groupware/
├── groupware-sdk/          # Go backend
│   ├── cmd/
│   │   └── server/        # Entry point
│   ├── config/            # Configuration
│   ├── internal/          # Internal packages
│   │   ├── auth/         # Authentication service
│   │   ├── approval/     # Electronic approval service
│   │   ├── middleware/   # HTTP middleware
│   │   └── model/        # Domain models
│   └── pkg/              # Public packages
│       ├── logger/       # Logging utilities
│       └── response/     # API response helpers
│
└── groupware-web/         # Next.js frontend
    ├── src/
    │   ├── app/          # Next.js pages (App Router)
    │   ├── components/   # React components
    │   ├── hooks/        # Custom React hooks
    │   ├── lib/          # API client and utilities
    │   ├── stores/       # Zustand state stores
    │   └── types/        # TypeScript type definitions
    └── public/           # Static assets
```

## Features

### Implemented
- User authentication (signup, login, token refresh, logout)
- Electronic approval workflow (draft, submit, approve, reject, withdraw)
- Real-time notifications (SSE)
- Dashboard with sync status
- File management UI (backend API pending)

### Planned
- File storage backend API
- Notice board system
- Instant messaging
- Calendar and scheduling
- PostgreSQL database integration
- Comprehensive test coverage
- Docker deployment

## Quick Start

### Prerequisites
- Go 1.24 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

```bash
cd groupware-sdk
go mod download
go run cmd/server/main.go
```

The backend server will start on `http://localhost:8080`

### Frontend Setup

```bash
cd groupware-web
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### Default Credentials

The backend includes a default admin user:
- Username: `admin`
- Password: `admin123`

## API Overview

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Electronic Approval
- `POST /api/approval/drafts` - Create draft
- `POST /api/approval/drafts/:id/submit` - Submit draft
- `POST /api/approval/requests/:id/approve` - Approve request
- `POST /api/approval/requests/:id/reject` - Reject request
- `POST /api/approval/requests/:id/withdraw` - Withdraw request
- `GET /api/approval/drafts` - List drafts
- `GET /api/approval/requests` - List requests
- `GET /api/approval/drafts/:id` - Get draft detail
- `GET /api/approval/requests/:id` - Get request detail

## Development Principles

1. **Three-layer architecture**: Handler → Service → Store
2. **Dependency injection**: Constructor-based DI
3. **Structured error handling**: Using `pkg/response` helpers
4. **Structured logging**: Zap logger
5. **Testing**: Unit tests for all services and handlers
6. **Documentation**: Comments for all public APIs
7. **Conventional commits**: feat, fix, docs, test, refactor, chore

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

See [spec.md](spec.md) for the complete project specification and development roadmap.

## Status

Current development phase: **Phase 1 - Open Source Infrastructure Setup**

For detailed implementation status, see [STATUS.md](STATUS.md).
