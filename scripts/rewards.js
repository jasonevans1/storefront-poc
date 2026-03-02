import { CORE_FETCH_GRAPHQL } from './commerce.js';

// Query: authenticated customer's reward points balance
export async function fetchRewardPointsBalance() {
  const { data, errors } = await CORE_FETCH_GRAPHQL.fetchGraphQl(`
    query GetCustomerRewardPoints {
      customer {
        reward_points {
          balance { points money { value currency } }
        }
      }
    }
  `);
  if (errors?.length) { console.error('Reward points balance error:', errors); return null; }
  return data?.customer?.reward_points?.balance ?? null;
}

// Query: reward points currently applied to a specific cart
export async function getCartAppliedRewards(cartId) {
  const { data, errors } = await CORE_FETCH_GRAPHQL.fetchGraphQl(`
    query GetCartAppliedRewards($cartId: String!) {
      cart(cart_id: $cartId) {
        applied_reward_points { points money { value currency } }
      }
    }
  `, { variables: { cartId } });
  if (errors?.length) return null;
  return data?.cart?.applied_reward_points ?? null;
}

// Mutation: apply reward points to cart
export async function applyRewardPoints(cartId) {
  const { data, errors } = await CORE_FETCH_GRAPHQL.fetchGraphQl(`
    mutation ApplyRewardPoints($cartId: ID!) {
      applyRewardPointsToCart(cartId: $cartId) {
        cart { applied_reward_points { points money { value currency } } }
      }
    }
  `, { method: 'POST', variables: { cartId } });
  if (errors?.length) throw new Error(errors[0].message);
  return data?.applyRewardPointsToCart?.cart?.applied_reward_points ?? null;
}

// Mutation: remove reward points from cart
export async function removeRewardPoints(cartId) {
  const { data, errors } = await CORE_FETCH_GRAPHQL.fetchGraphQl(`
    mutation RemoveRewardPoints($cartId: ID!) {
      removeRewardPointsFromCart(cartId: $cartId) {
        cart { applied_reward_points { points money { value currency } } }
      }
    }
  `, { method: 'POST', variables: { cartId } });
  if (errors?.length) throw new Error(errors[0].message);
  return data?.removeRewardPointsFromCart?.cart?.applied_reward_points ?? null;
}
