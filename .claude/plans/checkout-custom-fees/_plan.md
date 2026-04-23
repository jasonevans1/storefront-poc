# Plan: Checkout Custom Fees Integration

## Created

2026-04-21

## Status

completed

## Objective

Build the App Builder Commerce synchronous webhook handler that intercepts quote total collection, resolves the matching delivery fee rule from I/O State, and injects a custom total segment into the Commerce SaaS totals response — ensuring the fee is recorded in the actual order total.

## Scope

### In Scope

- App Builder: A synchronous Commerce Webhook handler action (`webhook-quote-total`) that intercepts quote total collection, reads the shipping address from the quote payload, calls the existing fee rule from I/O State, and injects a custom total segment into the Commerce totals response
- App Builder: `webhooks.xml` registration config to subscribe the handler to the Commerce quote totals operation
- App Builder: `actions/delivery-fee/actions.config.yaml` update to include the new webhook action

### Out of Scope

- Changes to the existing `calculate`, `rules-create`, `rules-delete`, `rules-get`, `rules-list` actions
- Changes to the Admin UI config page
- Multi-fee display (single calculated fee per address)
- Tax calculation on the custom fee
- Fee display on order confirmation, invoices, or emails (future phase)

## Success Criteria

- [ ] When a customer enters a shipping address on checkout, Commerce recalculates totals and the webhook fires
- [ ] The webhook handler resolves the matching fee rule from I/O State (via country/region) and returns it as a custom total segment
- [ ] The EDS storefront order summary displays the custom delivery fee line item when a fee applies
- [ ] No fee line item is displayed when no rule matches the address
- [ ] The fee is included in the Commerce order record (grand total includes the fee)
- [ ] All App Builder tests passing
- [ ] Code follows biome.jsonc standards

## Task Overview

| Task | Description                                | Depends On | Status    |
| ---- | ------------------------------------------ | ---------- | --------- |
| 001  | Webhook action config + directory scaffold | -          | completed |
| 002  | Webhook handler 6-file implementation      | 001        | completed |
| 003  | Commerce webhooks.xml registration         | 001        | completed |
| 004  | EDS delivery fee utility (fetch calculate) | -          | completed |
| 005  | EDS OrderSummary fee line item display     | 004        | completed |
| 006  | EDS checkout/updated event wiring          | 005        | completed |

## Architecture Notes

### Backend: Commerce Webhook Flow

```
Customer enters shipping address
  → Commerce recalculates quote totals
    → Synchronous webhook fires: plugin.magento.quote.api.cart_total_repository.get (after)
      → App Builder webhook-quote-total action
        → Reads country + region from quote shipping address
        → Calls state-service.getRule(country, region)
        → Computes fee (fixed or % of subtotal)
        → Returns { op: "add", value: { code, title, value } } to inject total segment
      → Commerce applies injected total segment to cart totals
        → Grand total updated to include fee
```

### Frontend: Storefront Display Flow

```
Customer enters/changes shipping address
  → EDS storefront receives checkout/updated event
    → commerce-checkout.js detects address country/region changed
      → Calls fetchDeliveryFee({ country, region, subtotal, currency }) (App Builder calculate action)
      → Updates mutable deliveryFeeState ref
      → Calls cartApi.refreshCart() to trigger OrderSummary re-render
        → updateLineItems callback reads deliveryFeeState
        → Injects fee as a line item (sortOrder 600, before reward points at 650)
        → Displays fee name + formatted amount
```

NOTE: The webhook (tasks 001-003) ensures the fee is part of the Commerce order record.
The storefront cannot read webhook-injected total segments because it uses GraphQL, not REST.
The storefront calls the calculate action directly for display purposes.

### Key Files

**App Builder (this repo):**

- `actions/delivery-fee/webhook-quote-total/` — new 6-file handler
- `actions/delivery-fee/actions.config.yaml` — add webhook action entry
- `app.config.yaml` — already includes delivery-fee package (no change needed)
- `.commerce-to-app-builder/webhooks.xml` — new webhook registration

**EDS Storefront (`/Users/jevans03/projects/storefront-poc`):**

- `scripts/delivery-fee.js` -- new utility (fetch fee from App Builder calculate action)
- `blocks/commerce-checkout/containers.js` -- update `renderOrderSummary`, export `deliveryFeeState`
- `blocks/commerce-checkout/commerce-checkout.js` -- wire `checkout/updated` for fee refresh

### Webhook Registration

Commerce synchronous webhooks use `webhooks.xml`:

```xml
<webhook name="plugin.magento.quote.api.cart_total_repository.get" method="after">
  <hook name="delivery-fee-total" url="{WEBHOOK_URL}" timeout="5000" softTimeout="2000" required="false">
    <fields>
      <field name="totals.total_segments" source="totals.total_segments" />
      <field name="totals.grand_total" source="totals.grand_total" />
    </fields>
  </hook>
</webhook>
```

- `required="false"` ensures checkout is not blocked if the webhook times out
- `softTimeout` of 2s allows Commerce to continue if App Builder is slow

### Commerce Total Segment Response Format

The webhook handler must return:

```json
{
  "op": "add",
  "path": "totals/total_segments/-",
  "value": {
    "code": "delivery_fee",
    "title": "{rule.name}",
    "value": 9.95
  }
}
```

And also update `grand_total`:

```json
{
  "op": "replace",
  "path": "totals/grand_total",
  "value": {existingGrandTotal + fee}
}
```

### Storefront: Fee Display Strategy

**IMPORTANT:** The EDS storefront uses GraphQL to fetch cart data. Commerce synchronous webhooks only modify REST API responses. Therefore, webhook-injected total segments do NOT appear in the GraphQL `CartModel` (`@dropins/storefront-cart`). The `CartModel` has no `totalSegments`, `total_segments`, or `customAmounts` field.

The storefront must call the App Builder `calculate` endpoint directly to get the fee amount for display. This is the **primary** path, not a fallback. The webhook (tasks 001-003) ensures the fee is recorded in Commerce for the order total, but the storefront cannot read it.

The `updateLineItems` callback receives the current line items array. Cart data is accessed via `cartApi.getCartDataFromCache()` to read the shipping address. The fee amount comes from calling the `calculate` action directly.

The delivery fee display uses a mutable state reference (same pattern as `rewardLineState`) that is read by the `updateLineItems` closure. When the address changes, the fee is recalculated and a `cartApi.refreshCart()` call triggers OrderSummary to re-render, invoking `updateLineItems` with the updated state.

### State Service Reuse

The webhook handler reuses the existing `actions/delivery-fee/lib/state-service.js` `getRule(country, region)` function. No new state access code needed.

## Risks & Mitigations

- **Commerce Webhook total injection schema**: The exact JSON Patch operations Commerce expects to add a total segment are not fully documented. The handler must be tested against a real Commerce SaaS sandbox. Risk: medium. Mitigation: `required="false"` ensures checkout is not blocked; log the full payload in pre.js for debugging.
- **Webhook timeout at checkout**: The fee lookup (I/O State `get()`) adds ~100-300ms to cart total recalculation. Mitigation: `softTimeout="2000"` — Commerce continues if App Builder is slow.
- **Cart totals model in EDS storefront**: The `CartModel` from `@dropins/storefront-cart` has NO `totalSegments` or `customAmounts` field. Commerce webhooks modify REST responses only; the EDS storefront uses GraphQL. **Resolution:** The storefront calls the App Builder `calculate` action directly for fee display (this is the primary path, not a fallback). The webhook ensures the fee is part of the Commerce order record.
- **No matching rule**: When no rule exists for the address, the webhook returns an empty response (no segments added). The storefront displays nothing. Verified via the existing `calculate` action logic (returns fee: 0 when no match).
- **Guest vs authenticated**: Webhook fires for both guest and authenticated carts. No auth-specific handling needed since the `calculate` action is public.
- **OrderSummary re-render via refreshCart**: The plan relies on `cartApi.refreshCart()` to trigger OrderSummary's `updateLineItems` callback after updating `deliveryFeeState`. If `refreshCart()` does not cause `updateLineItems` to re-invoke, the fallback is to use `unmountContainer(CONTAINERS.ORDER_SUMMARY)` then `renderOrderSummary($orderSummary)`. Verify during implementation.
- **renderContainer caching**: The `renderContainer` function caches instances by ID and prevents re-execution. Any re-render strategy must account for this (use mutable state refs, not re-calling render functions).
