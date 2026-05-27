# Contributing to Yumema

Thanks for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/sixtdreanight/Yumema.git
cd Yumema
npm install
npx vitest run
```

## Development Workflow

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npx tsc --noEmit` to type-check
4. Run `npx vitest run` to verify all tests pass
5. Add tests for new functionality
6. Commit using [Conventional Commits][conv] format
7. Push and open a pull request

## Commit Convention

```
feat: add group chat support
fix: prevent process.env leak in renderer
refactor: migrate core to companion-engine npm
test: add unit tests for NapCat manager
docs: update architecture docs
```

Types: `feat` `fix` `refactor` `test` `docs` `chore` `perf` `ci`

## Code Style

- TypeScript strict mode enabled
- Prefer immutability: return new objects, don't mutate
- Functions under 50 lines; files under 800 lines
- Use early returns to avoid deep nesting
- Electron main/renderer separation must be maintained

## Testing

- Minimum 80% coverage for new code
- AAA pattern (Arrange, Act, Assert)
- Mock Electron APIs in unit tests

## Pull Request Checklist

- [ ] TypeScript compiles without errors
- [ ] All tests pass (`npx vitest run`)
- [ ] New tests added for new behavior
- [ ] Electron security best practices followed
- [ ] Breaking changes noted in PR description

## Questions?

Open a [discussion](https://github.com/sixtdreanight/Yumema/discussions).

[conv]: https://www.conventionalcommits.org/
