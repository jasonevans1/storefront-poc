# Newsletter Management

## Overview

Authenticated newsletter management block for logged-in customers to view and toggle their newsletter subscription. Uses Adobe Commerce's `customer` query and `updateCustomerV2` mutation via `CORE_FETCH_GRAPHQL`.

## Integration

### Block Configuration

No configuration rows needed. The block is self-contained.

### Authoring

```
| Newsletter Management |
|---                    |
```

## Behavior Patterns

### Authentication Gating

- Uses `checkIsAuthenticated()` from `scripts/commerce.js`
- Unauthenticated users are redirected to `CUSTOMER_LOGIN_PATH`
- Follows the same pattern as `commerce-addresses` block

### User Interaction Flow

1. Block checks authentication on load
2. Fetches current subscription status via `customer` GraphQL query
3. Displays current status text and a Subscribe/Unsubscribe button
4. On button click: sends `updateCustomerV2` mutation
5. On success: updates status text and button label, shows success feedback
6. On error: shows inline error message

### Error Handling

- Unauthenticated: redirect to login page
- Query failure: shows error message in status area
- Mutation failure: shows error feedback, button re-enabled for retry
- GraphQL errors: displays the first error message from the response

### Placeholders

| Key                                   | Default                                   |
|---                                    |---                                        |
| `Newsletter.management.heading`       | Newsletter Subscription                   |
| `Newsletter.management.subscribed`    | You are subscribed to our newsletter.     |
| `Newsletter.management.unsubscribed`  | You are not subscribed to our newsletter. |
| `Newsletter.management.subscribe`     | Subscribe                                 |
| `Newsletter.management.unsubscribe`   | Unsubscribe                               |
| `Newsletter.management.success`       | Your subscription has been updated.       |
| `Newsletter.management.error`         | Something went wrong. Please try again.   |
