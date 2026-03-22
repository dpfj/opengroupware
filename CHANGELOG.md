# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project specification documentation (spec.md)
- Initial Go backend with Gin framework
- JWT-based authentication system
- Electronic approval workflow system
- Next.js 15 frontend with React 19
- Real-time notifications using Server-Sent Events (SSE)
- Dashboard with sync status UI
- File management UI components
- MIT License
- Code of Conduct (Contributor Covenant v2.1)
- Contributing guidelines
- README with project overview and quick start guide

### Backend Features
- User registration and login endpoints
- JWT token generation and refresh mechanism
- Electronic approval CRUD operations
- Approval workflow (draft → submit → approve/reject)
- Structured logging with Zap
- CORS middleware
- Authentication middleware
- Structured API response helpers

### Frontend Features
- Authentication pages (login, signup)
- Dashboard with statistics
- Electronic approval management interface
- File management interface (UI only)
- Real-time notification system with SSE
- Zustand for state management
- TanStack Query for data fetching
- Tailwind CSS v4 for styling
- Radix UI components

### Infrastructure
- Monorepo structure with Go backend and Next.js frontend
- In-memory data storage (PostgreSQL planned)
- Development environment setup
- Git repository initialization

## [0.1.0] - 2026-03-23

### Added
- Initial project setup
- Phase 0 status analysis and documentation
- Project specification v3.0
- Repository structure and organization
