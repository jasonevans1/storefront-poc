---
name: Code Standards
description: Coding conventions and linting rules for the storefront project
type: project
---

# Code Standards

## Style Guide
Airbnb Base (ESLint) + Standard CSS (Stylelint)

## Linting
```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# JS only
npm run lint:js

# CSS only
npm run lint:css
```

## Key ESLint Rules
- `import/extensions`: `.js` extension required on all imports
- `linebreak-style`: Unix linebreaks only
- `no-param-reassign`: Modifying param properties is allowed
- `no-use-before-define`: Enforced (functions exempt)
- `no-console`: Only `warn`, `error`, `info`, `debug` allowed
- `no-unused-vars`: Enforced; prefix with `_` to suppress
- `no-underscore-dangle`: Off (underscore prefixes allowed)

## Naming Conventions
- Block folders and files: `kebab-case` (e.g., `commerce-cart/commerce-cart.js`)
- Functions: `camelCase`
- Constants: `camelCase` or `SCREAMING_SNAKE_CASE` for true constants
- DOM element variables: prefix with `$` (e.g., `$block`, `$cartEl`)

## Module System
- ES Modules only (`import`/`export`) — no CommonJS
- Always include `.js` extension in import paths
- No bundler — code runs natively in browser

## Pre-commit Checks
- Husky is configured — linting runs on commit
- Fix lint errors before committing

## Dropin-Specific Rules
- Always verify slots and props from TypeScript definitions before use
- Never hallucinate slot names or container props
- Use `search_storefront_docs` MCP before implementing dropin customizations
- Use the documented container/slot interface before resorting to CSS
