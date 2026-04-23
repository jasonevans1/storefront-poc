---
name: Testing
description: Testing configuration and approach for the storefront project
type: project
---

# Testing

## Test Framework
No automated unit/integration test framework is in active use.

## Validation Approach
- Use the **playwright-cli skill** (`/playwright-cli`) to validate UI changes in `blocks/` and dropin customizations — navigate pages, interact with elements, take screenshots
- Manual testing via `aem up` dev server
- ESLint and Stylelint catch code quality issues before commit

## Commands
```bash
# Start dev server for manual testing
npm start

# Lint JS
npm run lint:js

# Lint CSS
npm run lint:css

# Lint both
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

## Notes
- The project has a `cypress/` directory but it is not actively used
- When making frontend changes, use the playwright-cli skill to visually validate the result
