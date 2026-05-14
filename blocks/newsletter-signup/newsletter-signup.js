import { readBlockConfig } from '../../scripts/aem.js';
import { CORE_FETCH_GRAPHQL, fetchPlaceholders } from '../../scripts/commerce.js';

// GraphQL mutations

const SUBSCRIBE_MUTATION = `
  mutation SubscribeEmailToNewsletter($email: String!) {
    subscribeEmailToNewsletter(email: $email) {
      status
    }
  }
`;

let blockInstanceId = 0;

export default async function decorate(block) {
  blockInstanceId += 1;
  const headingId = `newsletter-signup-heading-${blockInstanceId}`;
  const inputId = `newsletter-signup-input-${blockInstanceId}`;
  const errorId = `newsletter-signup-error-${blockInstanceId}`;

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

  // Section title — same authored text as before, now rendered as an <h2>.
  // The input gets the same text as its accessible name via aria-labelledby,
  // so we don't duplicate any authored strings on the page.
  const heading = document.createElement('h2');
  heading.id = headingId;
  heading.className = 'newsletter-signup__heading';
  heading.textContent = emailLabel;

  const form = document.createElement('form');
  form.className = 'newsletter-signup__form';
  // Render our own inline error instead of the browser's native tooltip
  // (WCAG 3.3.1 Error Identification — the native bubble is not reliably
  // styled or accessible).
  form.noValidate = true;
  form.innerHTML = `
    <input
      class="newsletter-signup__input"
      type="email"
      name="email"
      id="${inputId}"
      placeholder="${emailPlaceholder}"
      autocomplete="email"
      required
      aria-labelledby="${headingId}"
      aria-describedby="${errorId}"
    />
    <button class="newsletter-signup__submit button" type="submit">${submitLabel}</button>
  `;

  const errorBanner = document.createElement('div');
  errorBanner.id = errorId;
  errorBanner.className = 'newsletter-signup__error';
  errorBanner.setAttribute('role', 'alert');
  errorBanner.hidden = true;

  const successBanner = document.createElement('div');
  successBanner.className = 'newsletter-signup__success';
  successBanner.setAttribute('role', 'status');
  successBanner.hidden = true;
  successBanner.textContent = successMessage;

  const input = form.querySelector('.newsletter-signup__input');
  const submitBtn = form.querySelector('.newsletter-signup__submit');

  const setError = (message) => {
    errorBanner.textContent = message;
    errorBanner.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  };

  const clearError = () => {
    if (errorBanner.hidden) return;
    errorBanner.hidden = true;
    errorBanner.textContent = '';
    input.removeAttribute('aria-invalid');
  };

  // Clear the error as soon as the user starts correcting the input.
  input.addEventListener('input', clearError);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    // Surface the browser-localized validation message inline (empty field
    // or malformed email) rather than letting the native tooltip handle it.
    if (!input.checkValidity()) {
      setError(input.validationMessage);
      input.focus();
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = submittingText;
    submitBtn.disabled = true;

    try {
      const result = await CORE_FETCH_GRAPHQL.fetchGraphQl(SUBSCRIBE_MUTATION, {
        variables: { email: input.value },
      });

      if (result.errors?.length) {
        setError(result.errors[0].message || errorMessage);
      } else {
        form.hidden = true;
        heading.hidden = true;
        successBanner.hidden = false;
      }
    } catch {
      setError(errorMessage);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  block.append(heading, form, errorBanner, successBanner);
}
