---
name: Project Overview
description: Adobe Commerce Storefront on Edge Delivery Services
type: project
---

# Project Overview

## Project Name
Adobe Commerce Storefront POC (AEM Boilerplate Commerce)

## Description
A starter storefront project for Adobe Commerce on Edge Delivery Services (EDS/Helix). It combines Adobe's block-based EDS architecture with Adobe Commerce Dropins — pre-built microfrontend components for e-commerce functionality.

## Tech Stack
- **Platform**: Adobe Edge Delivery Services (AEM)
- **Language**: JavaScript (ES Modules, browser-native, no bundler)
- **Dropins**: `@dropins/` namespace — cart, checkout, pdp, account, auth, order, product-discovery, recommendations, wishlist, and many B2B dropins
- **Linting**: ESLint (airbnb-base config) + Stylelint
- **Dev Server**: `aem up` (via `@adobe/aem-cli`)
- **No test framework** in active use

## Project Type
Storefront web application — frontend only, connects to Adobe Commerce (Magento) backend via GraphQL/REST APIs.

## Key Concepts
- **Blocks**: EDS content blocks in `blocks/` — each block is a folder with a JS file (and optional CSS) that decorates a DOM element
- **Dropins**: Adobe Commerce microfrontends imported from `@dropins/` — NOT blocks; they render into DOM elements via provider functions
- **Initializers**: Each dropin must be initialized once via `scripts/initializers/` before use
- **Scripts**: Core EDS runtime logic in `scripts/` — `scripts.js`, `commerce.js`, `acdl/`, `utilities/`, etc.
