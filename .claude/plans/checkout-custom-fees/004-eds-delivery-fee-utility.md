# Task 004: EDS -- Delivery Fee Utility (Fetch from Calculate Action)

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Create a utility module in the EDS storefront (`/Users/jevans03/projects/storefront-poc/scripts/delivery-fee.js`) that fetches the delivery fee from the App Builder `calculate` action. This is the **primary** path for fee display -- the Commerce webhook (tasks 001-003) injects fees into REST responses for order totals, but the EDS storefront uses GraphQL, so webhook-injected total segments are not visible in the `CartModel`.

## Context

- Working directory for this task: `/Users/jevans03/projects/storefront-poc`
- Related files:
  - `blocks/commerce-checkout/containers.js` -- consumer of this utility (task 005)
  - `config.json` and `demo-config.json` -- site config files; add `delivery-fee-calculate-url` key here

- **No test framework is in use.** Requirements below serve as behavioral specs; validate with the playwright-cli skill.

- The `CartModel` from `@dropins/storefront-cart` has NO `totalSegments`, `total_segments`, or `customAmounts` field. Custom total segments injected by Commerce webhooks on REST endpoints do not flow through GraphQL queries. Therefore this utility calls the App Builder `calculate` action directly.

- **App Builder calculate endpoint URL**: read from site config using `getConfigValue` from `@dropins/tools/lib/aem/configs.js`. Config key: `delivery-fee-calculate-url`. Add this key to `config.json` and `demo-config.json` under `public.default`. Example value: `https://{OW_NAMESPACE}.adobeioruntime.net/api/v1/web/{PACKAGE}/delivery-fee/calculate`. **Do not hardcode the URL.**

- The existing `calculate` action accepts query params `country`, `region`, `subtotal`, `currency` and returns `{ fee, name, currency }`.

- The `CartModel` address data uses these paths:
  - `cartData.addresses?.shipping?.[0]?.countryCode` for shipping country
  - `cartData.addresses?.shipping?.[0]?.regionCode` for shipping region
  - `cartData.subtotal?.excludingTax` for subtotal `{ value, currency }`

## Requirements (Test Descriptions)

- [ ] `it calls the calculate endpoint with country, region, subtotal and currency`
- [ ] `it returns fee object with amount and label when calculate endpoint returns a fee`
- [ ] `it returns null when calculate endpoint returns fee of zero`
- [ ] `it returns null when calculate endpoint call fails`
- [ ] `it returns null when called with missing country`
- [ ] `it formats the fee amount as a number not a string`
- [ ] `it reads the calculate endpoint URL from site config`
- [ ] `it extracts shipping address and subtotal from CartModel correctly`

## Acceptance Criteria

- `scripts/delivery-fee.js` exports:
  - `fetchDeliveryFee({ country, region, subtotal, currency })` -- calls App Builder calculate endpoint, returns `{ amount, label, currency }` or `null`
  - `getDeliveryFeeParams(cartData)` -- extracts `{ country, region, subtotal, currency }` from `CartModel` or returns `null` if address is not set
- No hardcoded App Builder URLs -- reads `delivery-fee-calculate-url` via `getConfigValue` from `@dropins/tools/lib/aem/configs.js`
- `delivery-fee-calculate-url` config key added to `config.json` and `demo-config.json` under `public.default`
- Handles fetch errors gracefully (returns null, logs to console.warn)
- Passes lint (`npm run lint:js`)

## Implementation Notes

- The `fetchDeliveryFee` function is the primary and only path (no segment extraction from cart data)
- The existing `calculate` action accepts query params: `country`, `region`, `subtotal`, `currency` and returns `{ fee, name, currency }`
- Return shape from `fetchDeliveryFee`: `{ amount: number, label: string, currency: string }` (mapped from `fee` → `amount`, `name` → `label`)
- Zero-fee case: if response `fee === 0`, return `null` (no fee applies -- don't display a $0.00 line)
- URL construction: `const url = new URL(getConfigValue('delivery-fee-calculate-url')); url.searchParams.set('country', country); ...`
- `getDeliveryFeeParams(cartData)` reads from `CartModel`:
  - Country: `cartData.addresses?.shipping?.[0]?.countryCode`
  - Region: `cartData.addresses?.shipping?.[0]?.regionCode`
  - Subtotal: `cartData.subtotal?.excludingTax?.value`
  - Currency: `cartData.subtotal?.excludingTax?.currency`
  - Returns `null` if country is not available (no shipping address yet)
- **Import pattern** (no existing REST fetch utility to extend -- this is standalone):
  ```js
  import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
  ```
