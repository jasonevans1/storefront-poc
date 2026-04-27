# Task 003: Delete scripts/delivery-fee.js and remove dead config

**Status**: completed
**Depends on**: 001, 002
**Retry count**: 0

## Description
Delete `scripts/delivery-fee.js` now that both importers (containers.js and commerce-checkout.js) have been cleaned up. Also remove the now-orphaned `delivery-fee-calculate-url` config key from `config.json`. Verify no remaining references exist before deleting.

## Context
- Related files: `scripts/delivery-fee.js`, `config.json`
- After tasks 001 and 002 complete, a grep for `delivery-fee` across the project should only return:
  - `scripts/delivery-fee.js` itself (the file being deleted)
  - `config.json` line 31 (`"delivery-fee-calculate-url": "..."`) — this config was ONLY consumed by `scripts/delivery-fee.js` via `getConfigValue('delivery-fee-calculate-url')` and is now dead. Remove the key (and the trailing comma on the previous line as needed to keep JSON valid).
- The file exports `fetchDeliveryFee` and `getDeliveryFeeParams` — both are now unused

## Requirements (Test Descriptions)
- [x] `it verifies no remaining imports of delivery-fee.js exist in the codebase`
- [x] `it deletes scripts/delivery-fee.js`
- [x] `it confirms the file no longer exists after deletion`
- [x] `it removes the delivery-fee-calculate-url key from config.json`
- [x] `it confirms config.json remains valid JSON after the edit`

## Acceptance Criteria
- `grep -r "delivery-fee" .` (excluding `node_modules`, `.git`, and `.claude/plans`) returns no results
- `scripts/delivery-fee.js` does not exist
- `config.json` no longer contains `delivery-fee-calculate-url` and remains valid JSON
- `npm run lint` passes (no broken imports)
