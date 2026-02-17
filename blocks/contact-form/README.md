# Contact Form Block

A simple contact form with Name, Email, and Message fields. Submits via AJAX and shows a configurable success message.

## Authoring

Create a **Contact Form** table in Document Authoring (DA):

| Contact Form |  |
|---|---|
| success-message | Thank you for contacting us! |

### Block Settings

| Key | Description | Required |
|---|---|---|
| `success-message` | Message shown after successful submission | No (falls back to placeholder) |

## Placeholders

Add the following keys to your placeholders sheet for internationalization:

| Key | Default Value |
|---|---|
| `ContactForm.name.label` | Name |
| `ContactForm.email.label` | Email |
| `ContactForm.message.label` | Message |
| `ContactForm.submit` | Submit |
| `ContactForm.success` | Thank you for contacting us! We'll get back to you soon. |
| `ContactForm.error` | Something went wrong. Please try again. |
| `ContactForm.submitting` | Submitting... |

## Submission Endpoint

The `submitForm()` function in `contact-form.js` is a stub that resolves after 1 second. Replace it with your actual endpoint:

```javascript
async function submitForm(data) {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Submission failed');
}
```

## CSS Classes

| Class | Element |
|---|---|
| `.contact-form__form` | The `<form>` element |
| `.contact-form__field` | Field wrapper (`<div>`) |
| `.contact-form__label` | `<label>` elements |
| `.contact-form__input` | `<input>` elements |
| `.contact-form__textarea` | `<textarea>` element |
| `.contact-form__actions` | Submit button wrapper |
| `.contact-form__submit` | Submit `<button>` |
| `.contact-form__error` | Error message banner |
| `.contact-form__success` | Success message banner |
