import { readBlockConfig } from '../../scripts/aem.js';
import { CORE_FETCH_GRAPHQL, fetchPlaceholders } from '../../scripts/commerce.js';

const SUBSCRIBE_MUTATION = `
  mutation SubscribeEmailToNewsletter($email: String!) {
    subscribeEmailToNewsletter(email: $email) {
      status
    }
  }
`;

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const placeholders = await fetchPlaceholders('placeholders/newsletter.json');

  const emailLabel = placeholders?.Newsletter?.label || 'Newsletter Signup';
  const emailPlaceholder = placeholders?.Newsletter?.email?.placeholder || 'Enter your email';
  const submitLabel = placeholders?.Newsletter?.submit || 'Subscribe';
  const submittingText = placeholders?.Newsletter?.submitting || 'Subscribing...';
  const successMessage = config['success-message']
    || placeholders?.Newsletter?.success
    || 'Thanks for subscribing!';
  const errorMessage = placeholders?.Newsletter?.error || 'Something went wrong. Please try again.';

  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'newsletter-signup__form';
  form.innerHTML = `
    <label for="newsletter-signup-input" class="newsletter-signup__label">${emailLabel}</label>
    <input
      class="newsletter-signup__input"
      type="email"
      placeholder="${emailPlaceholder}"
      id="newsletter-signup-input"
      required
      aria-label="${emailPlaceholder}"
    />
    <button class="newsletter-signup__submit button" type="submit">${submitLabel}</button>
  `;

  const errorBanner = document.createElement('div');
  errorBanner.className = 'newsletter-signup__error';
  errorBanner.setAttribute('role', 'alert');
  errorBanner.hidden = true;

  const successBanner = document.createElement('div');
  successBanner.className = 'newsletter-signup__success';
  successBanner.setAttribute('role', 'status');
  successBanner.hidden = true;
  successBanner.textContent = successMessage;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBanner.hidden = true;

    const submitBtn = form.querySelector('.newsletter-signup__submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = submittingText;
    submitBtn.disabled = true;

    const email = form.querySelector('.newsletter-signup__input').value;

    try {
      const result = await CORE_FETCH_GRAPHQL.fetchGraphQl(SUBSCRIBE_MUTATION, {
        variables: { email },
      });

      if (result.errors?.length) {
        errorBanner.textContent = result.errors[0].message || errorMessage;
        errorBanner.hidden = false;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      } else {
        form.hidden = true;
        successBanner.hidden = false;
      }
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    } catch {
      errorBanner.textContent = errorMessage;
      errorBanner.hidden = false;
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  block.append(form, errorBanner, successBanner);
}
