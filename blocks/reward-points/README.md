# Reward Points Block

## Overview

Displays the authenticated customer's current reward points balance. The block is hidden for guest users and automatically shows/hides when the customer logs in or out.

## Integration

### Block Configuration

This block has no document-level configuration keys. Add it to a page as an empty block:

| reward-points |
|---------------|
|               |

### Placeholders

The following keys in the global placeholders spreadsheet control the display text:

| Placeholder Key | Default Value | Description |
|-----------------|---------------|-------------|
| `Global.RewardsTitle` | `Reward Points` | Heading text rendered above the balance |
| `Global.RewardsCurrentPointsLabel` | `Current Reward Points` | Label prefix for the points line |

### Events

#### Event Listeners

- `events.on('authenticated', callback, { eager: true })` — Shows the block and fetches the balance when the customer is authenticated; hides it on logout.

## Behavior Patterns

- **Guest / unauthenticated**: Block wrapper is `hidden`, nothing is visible.
- **Authenticated, balance available**: Shows the title and the points line, e.g. `Current Reward Points: 150`.
- **Authenticated, no balance returned**: Block remains hidden (API error or no reward points program enabled).

## Dependencies

- `scripts/rewards.js` — `fetchRewardPointsBalance()` GraphQL query.
- Global initializer (`scripts/initializers/index.js`) must have run so that `CORE_FETCH_GRAPHQL` has the customer auth token before the balance is fetched.
