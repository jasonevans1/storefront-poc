---
name: Architecture
description: Directory structure and architectural patterns for the storefront project
type: project
---

# Architecture

## Directory Structure

```
/
├── blocks/                    # EDS content blocks (one folder per block)
│   ├── commerce-cart/         # Block wrapping Cart dropin
│   ├── commerce-checkout/     # Block wrapping Checkout dropin
│   ├── product-details/       # Block wrapping PDP dropin
│   ├── product-list-page/     # Block wrapping Product Discovery dropin
│   ├── header/                # Site header (nav, mini-cart, search)
│   ├── footer/                # Site footer
│   └── ...                    # Many more blocks
├── scripts/                   # Core EDS runtime and utilities
│   ├── scripts.js             # Main EDS script — block loading, decoration
│   ├── commerce.js            # Commerce integration helpers
│   ├── initializers/          # One initializer per dropin (runs once at startup)
│   │   ├── cart.js
│   │   ├── auth.js
│   │   ├── pdp.js
│   │   └── ...
│   ├── utilities/             # Shared utility functions
│   ├── components/            # Shared UI components
│   └── acdl/                  # Adobe Client Data Layer integration
├── styles/                    # Global CSS
├── icons/                     # SVG icons
├── fonts/                     # Web fonts
├── models/                    # Component model definitions (JSON)
├── node_modules/@dropins/     # Dropin packages (source of truth for types)
└── docs-full.txt              # Local copy of full EDS/dropin documentation
```

## Architectural Patterns

### EDS Block Pattern
- Each block lives in `blocks/{block-name}/{block-name}.js` (+ optional `.css`)
- Blocks export a `default` function that receives a DOM element and decorates it
- Blocks are auto-loaded by EDS when the matching block class appears in page HTML
- Each block folder should have a `README.md` describing its behavior

### Dropin Integration Pattern
- Dropins are initialized once in `scripts/initializers/` (sets up auth, config, i18n)
- Blocks import dropin containers and render them into DOM elements using provider functions
- One block can render multiple dropin containers into different DOM elements
- Use the event bus (`@dropins/tools/event-bus.js`) for inter-dropin communication

### Provider Render Pattern
```javascript
import Container from '@dropins/storefront-{name}/containers/Container.js';
import { render as provider } from '@dropins/storefront-{name}/render.js';

provider(Container, { /* props */ })(domElement);
```

## Key Integrations
- **Adobe Commerce (Magento)**: Backend — GraphQL/REST APIs
- **Adobe Client Data Layer (ACDL)**: Analytics event tracking in `scripts/acdl/`
- **Magento Storefront Events SDK**: Commerce event collection
- **Edge Delivery Services**: Content delivery, page rendering, block decoration
