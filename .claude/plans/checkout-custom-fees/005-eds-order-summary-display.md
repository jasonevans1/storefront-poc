# Task 005: EDS -- renderOrderSummary updateLineItems for Fee Display

**Status**: completed
**Depends on**: 004
**Retry count**: 0

## Description

Update `renderOrderSummary` in `/Users/jevans03/projects/storefront-poc/blocks/commerce-checkout/containers.js` to display the custom delivery fee as a line item in the checkout order summary. Uses the `updateLineItems` transformer (the same pattern used for reward points) to inject a fee row when a delivery fee applies. The fee is sourced by calling the App Builder `calculate` action directly via `fetchDeliveryFee`.

**IMPORTANT architectural context:** The EDS storefront uses GraphQL for cart data. Commerce synchronous webhooks modify REST responses only. Therefore webhook-injected total segments do NOT appear in the `CartModel`. The storefront must call the App Builder `calculate` action directly for display.

## Context

- Working directory for this task: `/Users/jevans03/projects/storefront-poc`
- Related files:
  - `blocks/commerce-checkout/containers.js:468-501` -- existing `renderOrderSummary` with `updateLineItems` for reward points (direct reference pattern)
  - `scripts/delivery-fee.js` -- `fetchDeliveryFee` and `getDeliveryFeeParams` from task 004
  - `scripts/rewards.js` -- reference for `getCartAppliedRewards` pattern (async data fetch before render)
  - `blocks/commerce-checkout/containers.js` -- `h` is imported at line 54 from `@dropins/tools/preact.js`; use it for the fee DOM node

- The `updateLineItems` callback signature:

  ```js
  updateLineItems: (lineItems) => LineItem[]
  ```

  where `LineItem` is `{ key: string, sortOrder: number, content: HTMLElement }`.

- Reward points use `sortOrder: 650`. The delivery fee should appear **before** reward points at `sortOrder: 600` (fees before discounts in the summary).

- The `CartProvider.render(OrderSummary, { updateLineItems, slots })` pattern is already in place. This task adds fee injection alongside the existing reward points injection.

- **Re-render constraint:** `renderContainer` (line 146) caches the container in a registry and returns the cached instance on subsequent calls. The `updateLineItems` closure runs only when OrderSummary internally re-renders (e.g., after `cartApi.refreshCart()`). Use a **mutable state reference** (`deliveryFeeState`) that the closure reads, matching the `rewardLineState` pattern already in use.

## Requirements (Test Descriptions)

- [ ] `it adds a delivery fee line item when deliveryFeeState has a fee`
- [ ] `it does not add a delivery fee line item when deliveryFeeState is null`
- [ ] `it uses sortOrder 600 for the delivery fee line item`
- [ ] `it uses key deliveryFee for the delivery fee line item`
- [ ] `it displays the fee label from the rule name`
- [ ] `it displays the fee amount formatted as currency`
- [ ] `it fetches the delivery fee on initial render when address is known`
- [ ] `it preserves existing line items when adding the delivery fee`
- [ ] `it places the delivery fee line item before reward points (lower sortOrder)`
- [ ] `it exports deliveryFeeState for external updates by checkout event handler (task 006)`

## Acceptance Criteria

- All requirements have passing tests
- `containers.js` `renderOrderSummary` updated -- no other functions in the file are changed
- Fee row uses the same CSS class pattern as the reward points row for consistent styling (`.cart-order-summary__entry .cart-order-summary__surcharge` or similar -- check existing classes)
- Amount is formatted using `Intl.NumberFormat` (same pattern as reward points)
- A mutable `deliveryFeeState` object is exported from `containers.js` so task 006 can update it externally
- Passes lint

## Implementation Notes

Use a mutable state reference, matching the existing `rewardLineState` pattern:

```js
// Exported so task 006 can update it when address changes
export const deliveryFeeState = { fee: null };

export const renderOrderSummary = async (container) =>
  renderContainer(CONTAINERS.ORDER_SUMMARY, async () => {
    const cartData = cartApi.getCartDataFromCache();
    const appliedRewards = cartData?.id
      ? await getCartAppliedRewards(cartData.id).catch(() => null)
      : null;
    const rewardLineState = {
      applied: appliedRewards?.points ? appliedRewards : null,
    };

    // Fetch initial delivery fee if address is known
    const feeParams = getDeliveryFeeParams(cartData);
    if (feeParams) {
      deliveryFeeState.fee = await fetchDeliveryFee(feeParams).catch(
        () => null,
      );
    }

    return CartProvider.render(OrderSummary, {
      updateLineItems: (lineItems) => {
        // Add delivery fee if present
        let result = lineItems;
        if (deliveryFeeState.fee) {
          const formatted = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: deliveryFeeState.fee.currency || "USD",
          }).format(deliveryFeeState.fee.amount);
          result = [
            ...result,
            {
              key: "deliveryFee",
              sortOrder: 600,
              content: h(
                "div",
                {
                  className:
                    "cart-order-summary__entry cart-order-summary__surcharge",
                },
                h(
                  "span",
                  { className: "cart-order-summary__label" },
                  deliveryFeeState.fee.label,
                ),
                h(
                  "span",
                  { className: "cart-order-summary__price" },
                  formatted,
                ),
              ),
            },
          ];
        }

        // Existing reward points injection
        if (rewardLineState.applied?.points) {
          const rewardFormatted = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: rewardLineState.applied.money.currency,
          }).format(rewardLineState.applied.money.value);
          result = [
            ...result,
            {
              key: "rewardPointsDiscount",
              sortOrder: 650,
              content: h(
                "div",
                {
                  className:
                    "cart-order-summary__entry cart-order-summary__discount",
                },
                h(
                  "span",
                  { className: "cart-order-summary__label" },
                  "Reward Points",
                ),
                h(
                  "span",
                  { className: "cart-order-summary__price" },
                  `-${rewardFormatted}`,
                ),
              ),
            },
          ];
        }

        return result;
      },
      slots: {
        EstimateShipping: renderEstimateShipping,
        Coupons: renderCartCoupons,
        GiftCards: renderGiftCards,
      },
    })(container);
  });
```

**Key:** The `deliveryFeeState.fee` is read from the closure each time `updateLineItems` fires. Task 006 updates `deliveryFeeState.fee` and calls `cartApi.refreshCart()` to trigger a re-render.

**Note:** Verify exact CSS classes by reading existing order summary styles. `fetchDeliveryFee` returns `{ amount, label, currency }` (confirmed in task 004).
