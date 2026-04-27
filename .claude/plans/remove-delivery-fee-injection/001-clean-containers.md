# Task 001: Remove Delivery Fee from containers.js

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description
Remove all delivery fee display logic from `blocks/commerce-checkout/containers.js`. This includes the `deliveryFeeState` export, the imports of `fetchDeliveryFee` and `getDeliveryFeeParams`, the initial fee fetch inside `renderOrderSummary`, and the delivery fee injection block inside `updateLineItems`. The reward points injection in `updateLineItems` must be left intact.

## Context
- Related files: `blocks/commerce-checkout/containers.js`
- `deliveryFeeState` is at line 469 — an exported mutable object `{ fee: null }` (also remove its 4-line JSDoc above it at lines 463-468)
- Import of `fetchDeliveryFee` and `getDeliveryFeeParams` is at line 64
- Inside `renderOrderSummary` (line 476):
  - Lines 485-489: initial fee fetch using `getDeliveryFeeParams` + `fetchDeliveryFee` (including the `// Fetch initial delivery fee...` comment)
  - Lines 494-515 inside `updateLineItems`: the `if (deliveryFeeState.fee)` block that pushes the custom line item (including the `// Add delivery fee line item...` comment)
- The `rewardLineState` block and reward points injection (lines 483, 517-535) must NOT be touched
- The `h` import from `@dropins/tools/preact.js` (line 54) must be PRESERVED — it is still used by the reward points injection
- IMPORTANT: The file has `/* eslint-disable no-unused-vars */` at line 3, so `npm run lint` will NOT catch a leftover unused import. After editing, manually grep the file for `deliveryFee`, `fetchDeliveryFee`, and `getDeliveryFeeParams` to confirm zero hits.

## Requirements (Test Descriptions)
- [ ] `it removes the fetchDeliveryFee and getDeliveryFeeParams import from containers.js`
- [ ] `it removes the deliveryFeeState export from containers.js`
- [ ] `it removes the initial delivery fee fetch from renderOrderSummary`
- [ ] `it removes the delivery fee injection block from updateLineItems`
- [ ] `it preserves the reward points injection in updateLineItems`
- [ ] `it preserves all other container render functions unchanged`

## Acceptance Criteria
- No references to `deliveryFeeState`, `fetchDeliveryFee`, or `getDeliveryFeeParams` remain in the file
- `renderOrderSummary` still renders correctly with `updateLineItems` returning reward points when applicable
- `npm run lint` passes on the file
