# Contributing to Aether

Thank you for your interest in contributing to Aether! This guide will help you get started.

## Ways to Contribute

### 1. Create and Share Modules

The best way to contribute is by creating useful modules and sharing them:

- Build modules that solve real problems
- Publish them to npm

### 2. Improve Documentation

Help make Aether easier to use:

- Fix typos or unclear explanations
- Add examples where needed
- Share what confused you and how you solved it

### 3. Report Issues

Found a bug or have a suggestion?

- Check [existing issues](https://github.com/Lovelace-AI/aether/issues) first
- Create a new issue with clear description
- Include steps to reproduce bugs

### 4. Submit Pull Requests

- Fork the repository
- Create a feature branch
- Make your changes
- Submit a PR with clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/aether.git
cd aether

# Install dependencies
npm install

# Start development
npm run dev
```

## Code Style

We use Prettier for consistent formatting:

```bash
# Set up automatic formatting
./setup-prettier-hooks.sh

# Format manually
npm run format
```

## Testing

Before submitting PRs:

1. Test your changes locally
2. Ensure no TypeScript errors: `npm run type-check`
3. Check for linting issues: `npm run lint`
4. Test production build: `npm run build`

## Documentation Contributions

### Documentation Principles

- **Clear and Simple**: Write for developers new to Aether
- **Examples First**: Show, don't just tell
- **Stay Focused**: One topic per document
- **Be Helpful**: Anticipate common questions

## Creating Module Examples

If you create a great module pattern:

1. Add it to `/examples/` with clear documentation
2. Add a reusable template to `/patterns/` if applicable

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for module hot reload
fix: resolve event bus memory leak
docs: clarify module configuration options
refactor: simplify module registry logic
```

## Pull Request Process

1. **Create focused PRs** - One feature/fix per PR
2. **Write clear descriptions** - Explain what and why
3. **Update documentation** - If behavior changes
4. **Add tests** - If applicable
5. **Check CI passes** - All checks should be green

## Community Guidelines

- Be respectful and inclusive
- Help others learn
- Share your discoveries
- Celebrate contributions of all sizes

## Getting Help

- 🐛 [Issues](https://github.com/Lovelace-AI/aether/issues) - Report bugs
- 📧 [Email](mailto:support@lovelace.ai) - Direct contact

## Recognition

Contributors are recognized in:

- Release notes
- Contributors list
- Module credits (for module authors)

Thank you for helping make Aether better for everyone! 🎉
