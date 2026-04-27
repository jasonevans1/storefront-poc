# Plan: Remove Delivery Fee Display Injection

## Created
2026-04-27

## Status
completed

## Objective
Remove the manual delivery fee fetch-and-inject from the storefront checkout. The fee is now applied natively by Commerce via the OOP tax webhook and will appear automatically in the order summary tax breakdown.

## Related Issues
none

## Scope

### In Scope
- Remove `deliveryFeeState`, delivery fee fetch, and delivery fee line injection from `containers.js`
- Remove `refreshDeliveryFee()`, `lastFeeAddressKey`, and related imports (including the now-unused `cartApi` import) from `commerce-checkout.js`
- Delete `scripts/delivery-fee.js` (confirmed unused elsewhere)
- Remove the orphaned `delivery-fee-calculate-url` key from `config.json`

### Out of Scope
- Commerce Admin configuration (documented separately)
- `blocks/commerce-checkout-success/` — already reads from Commerce totals natively
- GraphQL queries or dropin configuration
- Backend / App Builder cleanup of the `delivery-fee/calculate` action endpoint (still consumed by other systems or kept for rollback)

## Success Criteria
- [ ] No references to `deliveryFeeState`, `refreshDeliveryFee`, `fetchDeliveryFee`, or `getDeliveryFeeParams` remain in checkout block files
- [ ] `cartApi` import is removed from `commerce-checkout.js` if no other usages exist
- [ ] `updateLineItems` callback in `renderOrderSummary` no longer injects a delivery fee line
- [ ] `scripts/delivery-fee.js` is deleted
- [ ] `delivery-fee-calculate-url` is removed from `config.json` and the file remains valid JSON
- [ ] `npm run lint` passes with no errors

## Task Overview
| Task | Description | Depends On | Status |
|------|-------------|------------|--------|
| 001 | Remove delivery fee from containers.js | - | completed |
| 002 | Remove refreshDeliveryFee + unused cartApi import from commerce-checkout.js | - | completed |
| 003 | Delete scripts/delivery-fee.js and remove dead config key | 001, 002 | completed |

## Architecture Notes
- Tasks 001 and 002 modify independent files and can run in parallel.
- Task 003 is gated on both — `delivery-fee.js` must have zero importers before deletion.
- Both `containers.js` and `commerce-checkout.js` carry `/* eslint-disable no-unused-vars */`, so `npm run lint` will NOT catch leftover unused imports. Workers must manually grep the edited files for the removed symbol names to verify a clean cut.

## Risks & Mitigations
- Reward points injection in `updateLineItems` must be preserved — only the delivery fee block is removed.
- The `h` import from `@dropins/tools/preact.js` in `containers.js` must remain — it is still used by the reward points injection.
- `deliveryFeeState` is imported by `commerce-checkout.js`; both files must be cleaned up before the export can be dropped.
- `cartApi` in `commerce-checkout.js` is ONLY used inside `refreshDeliveryFee` (`getCartDataFromCache` and `refreshCart`); removing the function makes the import dead. Confirm no other usage before deleting the import line.
- `delivery-fee-calculate-url` in `config.json` is consumed only by `scripts/delivery-fee.js`. Removing the script without removing the config key leaves dead configuration.
