# Newsletter Signup

## Overview

Public newsletter signup form that allows any visitor (guest or logged-in) to subscribe to the store newsletter via email. Uses Adobe Commerce's `subscribeEmailToNewsletter` GraphQL mutation directly via `CORE_FETCH_GRAPHQL`.

## Integration

### Block Configuration

| Configuration Key | Type      | Default                   | Description                                 | Required    | Side Effects                  |
|---                |---        |---                        |---                                          |---          |---                            |
| `success-message` | string    | `Thanks for subscribing!` | Message shown after successful subscription | No          | Overrides placeholder value   |

### Authoring

```
| Newsletter Signup |                           |
|---                |---                        |
| success-message   | Thanks for subscribing!   |
```

## Behavior Patterns

### User Interaction Flow

1. User enters email in the input field
2. User clicks "Subscribe" button
3. Button shows "Subscribing..." and is disabled during request
4. On success: form hides, success message appears
5. On error: inline error message appears with details (e.g., already subscribed)

### Error Handling

- Invalid email: Browser-native validation via `type="email"` and `required`
- Already subscribed: Shows error message from the GraphQL response
- Network/server errors: Shows generic error message with retry option

### Placeholders

| Key                               | Default                                   |
|---                                |---                                        |
| `Newsletter.email.placeholder`    | Enter your email                          |
| `Newsletter.submit`               | Subscribe                                 |
| `Newsletter.success`              | Thanks for subscribing!                   |
| `Newsletter.error`                | Something went wrong. Please try again.   |
| `Newsletter.submitting`           | Subscribing...                            |
