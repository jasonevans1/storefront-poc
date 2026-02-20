import {
  CORE_FETCH_GRAPHQL,
  CUSTOMER_LOGIN_PATH,
  checkIsAuthenticated,
  fetchPlaceholders,
  rootLink,
} from '../../scripts/commerce.js';

// GraphQL queries and mutations

const CUSTOMER_SUBSCRIPTION_QUERY = `
  query {
    customer {
      is_subscribed
    }
  }
`;

const UPDATE_SUBSCRIPTION_MUTATION = `
  mutation UpdateCustomerSubscription($isSubscribed: Boolean!) {
    updateCustomerV2(input: { is_subscribed: $isSubscribed }) {
      customer {
        is_subscribed
      }
    }
  }
`;

export default async function decorate(block) {
  if (!checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
    return;
  }

  const placeholders = await fetchPlaceholders('placeholders/newsletter.json');

  const heading = placeholders?.Newsletter?.management?.heading || 'Newsletter Subscription';
  const subscribedText = placeholders?.Newsletter?.management?.subscribed || 'You are subscribed to our newsletter.';
  const unsubscribedText = placeholders?.Newsletter?.management?.unsubscribed || 'You are not subscribed to our newsletter.';
  const subscribeLabel = placeholders?.Newsletter?.management?.subscribe || 'Subscribe';
  const unsubscribeLabel = placeholders?.Newsletter?.management?.unsubscribe || 'Unsubscribe';
  const successMessage = placeholders?.Newsletter?.management?.success || 'Your subscription has been updated.';
  const errorMessage = placeholders?.Newsletter?.management?.error || 'Something went wrong. Please try again.';

  block.textContent = '';

  const container = document.createElement('div');
  container.className = 'newsletter-management__card';

  const headingEl = document.createElement('h2');
  headingEl.className = 'newsletter-management__heading';
  headingEl.textContent = heading;

  const statusEl = document.createElement('p');
  statusEl.className = 'newsletter-management__status';

  const actionBtn = document.createElement('button');
  actionBtn.className = 'newsletter-management__toggle button';
  actionBtn.type = 'button';

  const feedback = document.createElement('div');
  feedback.className = 'newsletter-management__feedback';
  feedback.setAttribute('role', 'status');
  feedback.hidden = true;

  function renderState(isSubscribed) {
    statusEl.textContent = isSubscribed ? subscribedText : unsubscribedText;
    actionBtn.textContent = isSubscribed ? unsubscribeLabel : subscribeLabel;
    actionBtn.dataset.subscribed = isSubscribed;
  }

  // Fetch current status
  try {
    const result = await CORE_FETCH_GRAPHQL.fetchGraphQl(CUSTOMER_SUBSCRIPTION_QUERY);
    const isSubscribed = result?.data?.customer?.is_subscribed ?? false;
    renderState(isSubscribed);
  } catch {
    statusEl.textContent = errorMessage;
  }

  actionBtn.addEventListener('click', async () => {
    feedback.hidden = true;
    const currentlySubscribed = actionBtn.dataset.subscribed === 'true';
    const newValue = !currentlySubscribed;

    actionBtn.disabled = true;

    try {
      const result = await CORE_FETCH_GRAPHQL.fetchGraphQl(UPDATE_SUBSCRIPTION_MUTATION, {
        variables: { isSubscribed: newValue },
      });

      if (result.errors?.length) {
        feedback.textContent = result.errors[0].message || errorMessage;
        feedback.className = 'newsletter-management__feedback newsletter-management__feedback--error';
        feedback.hidden = false;
      } else {
        const updatedValue = result?.data?.updateCustomerV2?.customer?.is_subscribed ?? newValue;
        renderState(updatedValue);
        feedback.textContent = successMessage;
        feedback.className = 'newsletter-management__feedback newsletter-management__feedback--success';
        feedback.hidden = false;
      }
    } catch {
      feedback.textContent = errorMessage;
      feedback.className = 'newsletter-management__feedback newsletter-management__feedback--error';
      feedback.hidden = false;
    } finally {
      actionBtn.disabled = false;
    }
  });

  container.append(headingEl, statusEl, actionBtn, feedback);
  block.append(container);
}
