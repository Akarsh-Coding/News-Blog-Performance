// Custom regex validation for the "Submit a Story" form.
const RULES = {
  title: {
    required: 'Title is required.',
    pattern: /^.{5,100}$/,
    invalid: 'Title must be 5 to 100 characters.',
  },
  email: {
    required: 'Author email is required.',
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
    invalid: 'Enter a valid email address.',
  },
  summary: {
    required: 'Summary is required.',
    pattern: /^[\s\S]{20,500}$/,
    invalid: 'Summary must be 20 to 500 characters.',
  },
}

export const FIELD_ORDER = ['title', 'email', 'summary']

/** Returns an error message, or '' when the value is valid. */
export function validateField(name, value) {
  const { required, pattern, invalid } = RULES[name]
  const trimmed = value.trim()
  if (trimmed === '') return required
  return pattern.test(trimmed) ? '' : invalid
}

/** Returns { fieldName: message } for every invalid field (empty object = valid). */
export function validateStory(values) {
  const errors = {}
  for (const name of FIELD_ORDER) {
    const message = validateField(name, values[name] ?? '')
    if (message) errors[name] = message
  }
  return errors
}
