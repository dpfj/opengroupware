# Contributing to OpenGroupware

Thank you for your interest in contributing to OpenGroupware! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with the following information:
- Clear and descriptive title
- Steps to reproduce the problem
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Go version, Node.js version)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:
- Clear and descriptive title
- Detailed description of the proposed feature
- Use cases and benefits
- Any relevant examples or mockups

### Pull Requests

We actively welcome your pull requests:

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for your changes
5. Ensure all tests pass
6. Commit your changes using conventional commits
7. Push to your branch (`git push origin feat/amazing-feature`)
8. Open a Pull Request

## Development Workflow

### Prerequisites

- Go 1.24 or higher
- Node.js 18 or higher
- Git

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/dpfj/opengroupware.git
cd opengroupware

# Backend setup
cd groupware-sdk
go mod download

# Frontend setup
cd ../groupware-web
npm install
```

### Running Tests

#### Backend Tests
```bash
cd groupware-sdk
go test ./...
go test -cover ./...
```

#### Frontend Tests
```bash
cd groupware-web
npm test
npm run test:coverage
```

### Code Style

#### Go Code Style
- Follow standard Go conventions and idioms
- Use `gofmt` for code formatting
- Run `golangci-lint` before committing
- Add comments for all exported functions and types
- Keep functions small and focused
- Use meaningful variable names

#### TypeScript/React Code Style
- Follow the project's ESLint configuration
- Use Prettier for code formatting
- Write TypeScript with strict type checking
- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and variable names

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

#### Examples
```
feat(auth): add password reset functionality

Implement password reset flow with email verification.
Includes backend API endpoint and frontend form.

Closes #123
```

```
fix(approval): resolve state sync issue

Fix race condition in approval status updates that caused
stale data in the UI.

Fixes #456
```

### Branch Strategy

- `main` - Production-ready code
- `feat/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions or updates

### Pull Request Process

1. Update the README.md or documentation with details of changes if applicable
2. Update the CHANGELOG.md following the Keep a Changelog format
3. Ensure all tests pass and add new tests for your changes
4. Ensure code follows the project's style guidelines
5. Your PR will be reviewed by maintainers
6. Address any feedback from code review
7. Once approved, your PR will be merged

### Code Review Guidelines

When reviewing code:
- Be respectful and constructive
- Focus on the code, not the person
- Ask questions rather than making demands
- Acknowledge good practices
- Suggest improvements with explanations

## Project Structure

### Backend (groupware-sdk)
```
internal/
├── auth/          # Authentication service
├── approval/      # Approval workflow service
├── middleware/    # HTTP middleware
└── model/         # Domain models

pkg/
├── logger/        # Logging utilities
└── response/      # API response helpers
```

### Frontend (groupware-web)
```
src/
├── app/           # Next.js pages and routes
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and API client
├── stores/        # Zustand state stores
└── types/         # TypeScript types
```

## Design Principles

1. **Three-layer architecture**: Handler → Service → Store
2. **Dependency injection**: Constructor-based dependency injection
3. **Error handling**: Structured error responses
4. **Logging**: Structured logging with contextual information
5. **Testing**: Aim for 80% code coverage
6. **Documentation**: Document all public APIs and complex logic

## Design Patterns

### Backend (Go)
- **Handler**: HTTP request handling
- **Service**: Business logic implementation
- **Repository**: Data access abstraction
- **Middleware**: Request/response pipeline processing
- **Dependency Injection**: Constructor-based DI

### Frontend (React)
- **Hooks**: Logic reuse and encapsulation
- **Provider**: Context and global state
- **Adapter**: API client abstraction
- **State Management**: Zustand for global state

## Getting Help

- Create an issue for bugs or feature requests
- Check existing issues before creating new ones
- Join discussions in GitHub Discussions
- Read the [spec.md](spec.md) for project specification

## License

By contributing to OpenGroupware, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in the project's README and release notes.

Thank you for contributing to OpenGroupware!
