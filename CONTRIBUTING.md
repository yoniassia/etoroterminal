# Contributing to eToro Terminal

Thank you for your interest in contributing to eToro Terminal! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build something great.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/etoro-terminal.git
   cd etoro-terminal
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3005

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Use functional components with hooks
- Keep components small and focused

### File Organization

```
src/
├── api/           # API adapters and contracts
├── components/    # React components
│   └── panels/    # Panel components (one per function code)
├── contexts/      # React contexts
├── services/      # Business logic and API clients
├── stores/        # State management
└── utils/         # Utility functions
```

### Adding a New Panel

1. Create component in `src/components/panels/YourPanel.tsx`
2. Create styles in `src/components/panels/YourPanel.css`
3. Register in panel registry
4. Add function code to command bar

### Testing

Before submitting a PR, run the automated tests:

```bash
npm run ralph <publicKey> <userKey>
```

All tests should pass.

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Run the test suite** and ensure all tests pass
4. **Update the changelog** in `docs/CHANGELOG_v1.1.3.md`
5. **Create a descriptive PR** with:
   - What changed and why
   - Screenshots for UI changes
   - Breaking changes (if any)

### PR Title Format

Use conventional commit format:

- `feat: add new trading panel`
- `fix: correct quote display issue`
- `docs: update API documentation`
- `refactor: improve symbol resolver`

## Reporting Issues

When reporting bugs, please include:

1. **Description** of the issue
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Screenshots** (if applicable)
6. **Environment** (OS, browser, Node version)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists or is planned
2. Describe the use case
3. Explain the expected behavior
4. Consider implementation complexity

## Security Issues

**Do not** report security vulnerabilities in public issues.

Instead, email the maintainers directly with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Questions?

Open a discussion on GitHub or reach out to the maintainers.

---

Thank you for contributing! 🎉
