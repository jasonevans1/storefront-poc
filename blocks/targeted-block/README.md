# Targeted Block

## Overview

Targeted block exists, but fails github check because it didn't come with a readme. Functionality hasn't changed.

## Reference

Field reference:

  Field: Customer Groups
  Value: Comma-separated numeric IDs
  Notes: e.g. 1 = General, 2 = Wholesale. Find in Commerce Admin → Customers → Customer Groups
  ────────────────────────────────────────
  Field: Customer Segments
  Value: Comma-separated numeric IDs
  Notes: Commerce Admin → Customers → Segments. Only available in Adobe Commerce (not Open Source)
  ────────────────────────────────────────
  Field: Cart Rules
  Value: Comma-separated numeric IDs
  Notes: Commerce Admin → Marketing → Cart Price Rules
  ────────────────────────────────────────
  Field: Type
  Value: Any string
  Notes: When multiple targeted-block instances share the same type on a page, only the first matching one renders — use this for A/B style swaps
  ────────────────────────────────────────
  Field: Fragment
  Value: Relative doc path
  Notes: If set, loads that EDS fragment as the content instead of the inline row