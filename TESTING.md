# Testing

This project uses Vitest with React Testing Library for fast component and unit tests.

100% test coverage is the goal. Tests let the project move quickly without turning changes into guesswork.

## Run tests

```bash
npm run test
```

## Test layers

- Unit/component tests live under `test/` and use `*.test.tsx` naming.
- Component tests should assert user-visible behavior: links, headings, states, and callbacks.
- Integration or E2E coverage should be added for multi-page flows when those flows become active product surfaces.

## Conventions

- Prefer `screen.getByRole` and accessible names over implementation details.
- Mock framework hooks at module boundaries, such as `next/navigation`.
- Every bug fix should get a regression test that fails without the fix.
