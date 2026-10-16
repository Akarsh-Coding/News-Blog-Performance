import { memo, useState } from 'react'
import { submitStory } from '../api/newsApi'
import { trackInteraction } from '../utils/analytics'
import { sanitizeText } from '../utils/sanitizeText'
import { FIELD_ORDER, validateField, validateStory } from '../utils/validateStory'
import './StoryForm.css'

const EMPTY_VALUES = { title: '', email: '', summary: '' }

function Field({ id, name, label, error, multiline = false, ...controlProps }) {
  const Control = multiline ? 'textarea' : 'input'
  const errorId = `${id}-error`
  const classes = ['field__control', multiline && 'field__control--textarea', error && 'field__control--error']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <Control
        id={id}
        name={name}
        className={classes}
        required
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...controlProps}
      />
      {error && (
        <p id={errorId} className="field__error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
}

function StoryForm() {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle') // idle | submitting | success | error

  const isSubmitting = submitStatus === 'submitting'

  function handleChange(event) {
    const { name } = event.target
    const value = sanitizeText(event.target.value) // never store markup
    setValues((previous) => ({ ...previous, [name]: value }))
    // Once a field is flagged, re-check it as the user types so the error clears when fixed.
    if (errors[name]) {
      const message = validateField(name, value)
      setErrors((previous) => {
        const next = { ...previous }
        if (message) next[name] = message
        else delete next[name]
        return next
      })
    }
    if (!isSubmitting) setSubmitStatus('idle')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    const nextErrors = validateStory(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name])
    if (firstInvalid) {
      event.currentTarget.elements.namedItem(firstInvalid).focus()
      return
    }

    setSubmitStatus('submitting')
    try {
      await submitStory({
        title: values.title.trim(),
        email: values.email.trim(),
        summary: values.summary.trim(),
      })
      setValues(EMPTY_VALUES)
      setSubmitStatus('success')
      trackInteraction() // only when the submission actually completed
    } catch {
      setSubmitStatus('error')
    }
  }

  return (
    <form className="story-form" aria-labelledby="story-form-heading" noValidate onSubmit={handleSubmit}>
      <h2 id="story-form-heading" className="story-form__heading">
        Submit a story
      </h2>
      <p className="story-form__intro">Know something we should cover? All fields are required.</p>

      <Field id="story-title" name="title" label="Title" value={values.title} error={errors.title} onChange={handleChange} autoComplete="off" />
      <Field
        id="story-email"
        name="email"
        label="Author email"
        type="email"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
        autoComplete="email"
      />
      <Field
        id="story-summary"
        name="summary"
        label="Summary"
        multiline
        rows={4}
        value={values.summary}
        error={errors.summary}
        onChange={handleChange}
      />

      <div className="story-form__actions">
        <button type="submit" className="button" disabled={isSubmitting}>
          Submit story
        </button>

        {/* Persistent polite live region (exists before any message), so progress is announced. */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {submitStatus === 'submitting' && <p className="status">Submitting your story…</p>}
          {submitStatus === 'success' && <p className="status">Thank you! Your story was submitted for review.</p>}
        </div>

        {submitStatus === 'error' && (
          <p role="alert" className="status status--error">
            We couldn’t submit your story. What you typed is still here, so you can try again.
          </p>
        )}
      </div>
    </form>
  )
}

export default memo(StoryForm)
