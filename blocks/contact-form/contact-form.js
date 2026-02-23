import { readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, CORE_FETCH_GRAPHQL } from '../../scripts/commerce.js';

async function submitForm({ name, email, message }) {
  const { data, errors } = await CORE_FETCH_GRAPHQL.fetchGraphQl(`
    mutation ContactUs($input: ContactUsInput!) {
      contactUs(input: $input) {
        status
      }
    }
  `, {
    method: 'POST',
    variables: { input: { name, email, comment: message } },
  });
  if (errors?.length) throw new Error(errors[0].message);
  if (!data?.contactUs?.status) throw new Error('Submission failed');
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const placeholders = await fetchPlaceholders('placeholders/contact-form.json');

  const successMessage = config['success-message']
    || placeholders['ContactForm.success']
    || 'Thank you for contacting us! We\'ll get back to you soon.';
  const errorMessage = placeholders?.ContactForm.error || 'Something went wrong. Please try again.';
  const submittingText = placeholders?.ContactForm.submitting || 'Submitting...';
  const nameLabel = placeholders?.ContactForm.name.label || 'Your Name';
  const emailLabel = placeholders?.ContactForm.email.label || 'Your Email';
  const messageLabel = placeholders?.ContactForm.message.label || 'Your Message';
  const submitLabel = placeholders?.ContactForm.submit || 'Submit';

  // Clear authored config rows
  block.textContent = '';

  // Build contact form
  const form = document.createElement('form');
  form.className = 'contact-form__form';

  form.innerHTML = `
    <div class="contact-form__field">
      <label class="contact-form__label" for="contact-name">${nameLabel}</label>
      <input class="contact-form__input" type="text" id="contact-name" name="name" required>
    </div>
    <div class="contact-form__field">
      <label class="contact-form__label" for="contact-email">${emailLabel}</label>
      <input class="contact-form__input" type="email" id="contact-email" name="email" required>
    </div>
    <div class="contact-form__field">
      <label class="contact-form__label" for="contact-message">${messageLabel}</label>
      <textarea class="contact-form__textarea" id="contact-message" name="message" rows="5" required></textarea>
    </div>
    <div class="contact-form__actions">
      <button class="contact-form__submit button" type="submit">${submitLabel}</button>
    </div>
  `;

  // Error banner (hidden by default)
  const errorBanner = document.createElement('div');
  errorBanner.className = 'contact-form__error';
  errorBanner.setAttribute('role', 'alert');
  errorBanner.hidden = true;
  errorBanner.textContent = errorMessage;

  // Success banner (hidden by default)
  const successBanner = document.createElement('div');
  successBanner.className = 'contact-form__success';
  successBanner.setAttribute('role', 'status');
  successBanner.hidden = true;
  successBanner.textContent = successMessage;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBanner.hidden = true;

    const submitBtn = form.querySelector('.contact-form__submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = submittingText;
    submitBtn.disabled = true;

    const data = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      message: form.elements.message.value,
    };

    try {
      await submitForm(data);
      form.hidden = true;
      errorBanner.hidden = true;
      successBanner.hidden = false;
    } catch {
      errorBanner.hidden = false;
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  block.append(form, errorBanner, successBanner);
}
