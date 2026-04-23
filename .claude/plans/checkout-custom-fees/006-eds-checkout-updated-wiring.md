# Task 006: EDS -- checkout/updated Event Wiring + Address Change Refresh

**Status**: complete
**Depends on**: 005
**Retry count**: 0

## Description

Wire the `checkout/updated` event in `blocks/commerce-checkout/commerce-checkout.js` so that when the shipping address changes during checkout, the delivery fee is recalculated and the order summary re-renders to reflect the updated fee. Commerce recalculates totals when the address is confirmed; this task ensures the EDS storefront fetches the new fee from the App Builder `calculate` action and triggers an OrderSummary update.

## Context

- Working directory for this task: `/Users/jevans03/projects/storefront-poc`
- Related files:
  - `blocks/commerce-checkout/commerce-checkout.js` -- already listens to `checkout/initialized`, `checkout/updated`, `checkout/values`, `order/placed` events
  - `blocks/commerce-checkout/containers.js` -- `deliveryFeeState` (exported mutable ref, from task 005)
  - `scripts/delivery-fee.js` -- `fetchDeliveryFee` and `getDeliveryFeeParams` (from task 004)

- **checkout/updated event payload shape:** The `checkout/updated` event fires with a `Cart` object (from `@dropins/storefront-checkout/data/models/cart`):

  ```typescript
  interface Cart {
    shippingAddresses: CartShippingAddress[]; // ARRAY, not singular
    // CartShippingAddress extends Address which has:
    //   country: { code: string, label: string }  // NOT countryCode
    //   region?: { code: string, id?: number, name: string }  // NOT regionCode
    // ...
  }
  ```

- **Re-render strategy:** `renderContainer` caches instances and prevents re-rendering. Instead of calling `renderOrderSummary()` again:
  1. Update `deliveryFeeState.fee` (mutable ref from task 005)
  2. Call `cartApi.refreshCart()` to trigger OrderSummary to re-invoke `updateLineItems`

- Existing `checkout/updated` handler in `commerce-checkout.js` (line 299-302):

  ```js
  async function handleCheckoutUpdated(data) {
    if (!data) return;
    await initializeCheckout(data);
  }
  ```

  The delivery fee logic must be added here or alongside it.

- **CartModel vs Cart:** The `checkout/updated` event uses the **checkout** Cart model (with `shippingAddresses` array of objects with `country.code`). The **cart** CartModel (from `@dropins/storefront-cart`) uses `addresses.shipping[].countryCode`. The `getDeliveryFeeParams` helper (task 004) reads from the cart CartModel. For the event handler, extract address directly from the checkout Cart payload.

## Requirements (Test Descriptions)

- [x] `it recalculates delivery fee when checkout/updated fires with a new shipping address`
- [x] `it does not recalculate when address country and region have not changed`
- [x] `it recalculates when shipping country changes`
- [x] `it recalculates when shipping region changes`
- [x] `it does not recalculate when checkout/updated fires with no shipping address`
- [x] `it stores previous address key to prevent unnecessary API calls`
- [x] `it updates deliveryFeeState.fee with the new fee`
- [x] `it sets deliveryFeeState.fee to null when no fee applies`
- [x] `it calls cartApi.refreshCart after updating deliveryFeeState to trigger re-render`

## Acceptance Criteria

- All requirements have passing tests
- `commerce-checkout.js` updated -- the existing `handleCheckoutUpdated` function or a new function alongside it handles delivery fee refresh
- Address comparison uses `country.code + region.code` as the change-detection key (not full address comparison)
- Imports `deliveryFeeState` from `./containers.js` and `fetchDeliveryFee` from `../../scripts/delivery-fee.js`
- `cartApi` is already imported in `commerce-checkout.js` at line 33 — no new import needed
- Passes lint

## Implementation Notes

In `commerce-checkout.js`, add delivery fee refresh logic:

```js
import { deliveryFeeState } from "./containers.js";
import { fetchDeliveryFee } from "../../scripts/delivery-fee.js";
import * as cartApi from "@dropins/storefront-cart/api.js";

// Track previous address for change detection
let lastFeeAddressKey = null;

async function refreshDeliveryFee(checkoutData) {
  // Extract first shipping address from checkout Cart model
  const addr = checkoutData?.shippingAddresses?.[0];
  const country = addr?.country?.code;
  const region = addr?.region?.code ?? "";
  const feeKey = country ? `${country}:${region}` : null;

  // Skip if address hasn't changed
  if (feeKey === lastFeeAddressKey) return;
  lastFeeAddressKey = feeKey;

  if (!feeKey) {
    deliveryFeeState.fee = null;
    return;
  }

  // Get subtotal from cart data (cart CartModel, not checkout Cart)
  const cartData = cartApi.getCartDataFromCache();
  const subtotal = cartData?.subtotal?.excludingTax?.value ?? 0;
  const currency = cartData?.subtotal?.excludingTax?.currency ?? "USD";

  if (subtotal <= 0) {
    deliveryFeeState.fee = null;
    return;
  }

  try {
    deliveryFeeState.fee = await fetchDeliveryFee({
      country,
      region,
      subtotal,
      currency,
    });
  } catch {
    deliveryFeeState.fee = null;
  }

  // Trigger OrderSummary to re-render by refreshing cart data
  await cartApi.refreshCart();
}

// Wire into the existing event handler:
async function handleCheckoutUpdated(data) {
  if (!data) return;
  await initializeCheckout(data);
  await refreshDeliveryFee(data);
}
```

**IMPORTANT notes:**

1. The `checkout/updated` payload uses checkout `Cart` model: `shippingAddresses[0].country.code` and `shippingAddresses[0].region?.code`. This is DIFFERENT from the cart `CartModel` which uses `addresses.shipping[0].countryCode`.
2. `cartApi.refreshCart()` triggers the OrderSummary container to re-render internally, which re-invokes the `updateLineItems` callback. Since `deliveryFeeState` is a mutable ref, the callback will read the updated fee.
3. Guard against `refreshCart` causing another `checkout/updated` event that triggers infinite recursion -- the `lastFeeAddressKey` check prevents this since the address won't have changed.
4. `cartApi` may already be imported in `commerce-checkout.js` via other imports. Check before adding a duplicate import.

**Verify:** Confirm that `cartApi.refreshCart()` actually causes OrderSummary `updateLineItems` to be re-invoked. If not, an alternative is to call `unmountContainer(CONTAINERS.ORDER_SUMMARY)` followed by `renderOrderSummary($orderSummary)`, but this requires importing both from `containers.js`.
