import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { fillStory, getStoryFields, renderLoadedApp } from '../test/helpers'
import { VALID_STORY } from '../test/fixtures'

const isFlagged = (field) => field.getAttribute('aria-invalid') === 'true'
const looksRed = (field) => /error|invalid/i.test(field.className)

describe('Unhappy path — invalid input on the "Submit a story" form', () => {
  it('blocks submission and flags every field when the form is empty', async () => {
    const { user, postCalls } = await renderLoadedApp()
    await user.click(getStoryFields().submit)

    expect(postCalls()).toHaveLength(0)
    const { title, email, summary } = getStoryFields()
    for (const field of [title, email, summary]) {
      expect(field).toHaveAttribute('aria-invalid', 'true')
      expect(looksRed(field)).toBe(true)
      expect(field).toHaveAccessibleDescription(/required/i)
    }
  })

  it('shows each error inline, next to its own field', async () => {
    const { user } = await renderLoadedApp()
    await user.click(getStoryFields().submit)
    expect(screen.getByText(/title is required/i)).toBeVisible()
    expect(screen.getByText(/author email is required/i)).toBeVisible()
    expect(screen.getByText(/summary is required/i)).toBeVisible()
  })

  it('moves focus to the first invalid field', async () => {
    const { user } = await renderLoadedApp()
    await user.click(getStoryFields().submit)
    expect(getStoryFields().title).toHaveFocus()
  })

  it('blocks a malformed email and flags only that field', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillStory(user, { ...VALID_STORY, email: 'not-an-email' })
    await user.click(submit)

    expect(postCalls()).toHaveLength(0)
    const { title, email, summary } = getStoryFields()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription(/valid email/i)
    expect(isFlagged(title)).toBe(false)
    expect(isFlagged(summary)).toBe(false)
  })

  it('blocks a title that is too short', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillStory(user, { ...VALID_STORY, title: 'abc' })
    await user.click(submit)

    expect(postCalls()).toHaveLength(0)
    expect(getStoryFields().title).toHaveAttribute('aria-invalid', 'true')
    expect(getStoryFields().title).toHaveAccessibleDescription(/5 to 100 characters/i)
  })

  it('blocks a summary shorter than 20 characters', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillStory(user, { ...VALID_STORY, summary: 'too short' })
    await user.click(submit)

    expect(postCalls()).toHaveLength(0)
    expect(getStoryFields().summary).toHaveAttribute('aria-invalid', 'true')
    expect(getStoryFields().summary).toHaveAccessibleDescription(/20 to 500 characters/i)
  })

  it('treats a whitespace-only title as missing', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillStory(user, { ...VALID_STORY, title: '          ' })
    await user.click(submit)

    expect(postCalls()).toHaveLength(0)
    expect(getStoryFields().title).toHaveAttribute('aria-invalid', 'true')
    expect(getStoryFields().title).toHaveAccessibleDescription(/required/i)
  })

  it('does not show error states before the user has tried to submit', async () => {
    await renderLoadedApp()
    const { title, email, summary } = getStoryFields()
    for (const field of [title, email, summary]) {
      expect(isFlagged(field)).toBe(false)
      expect(looksRed(field)).toBe(false)
    }
  })

  it('clears a field’s error as soon as the user fixes it', async () => {
    const { user } = await renderLoadedApp()
    await fillStory(user, { ...VALID_STORY, email: 'nope' })
    await user.click(getStoryFields().submit)
    expect(getStoryFields().email).toHaveAttribute('aria-invalid', 'true')

    await user.clear(getStoryFields().email)
    await user.type(getStoryFields().email, VALID_STORY.email)
    expect(isFlagged(getStoryFields().email)).toBe(false)
    expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument()
  })

  it('submits once the user corrects the fields', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillStory(user, { ...VALID_STORY, email: 'nope' })
    await user.click(submit)
    expect(postCalls()).toHaveLength(0)

    await user.clear(getStoryFields().email)
    await user.type(getStoryFields().email, VALID_STORY.email)
    await user.click(submit)

    expect(postCalls()).toHaveLength(1)
    expect(await screen.findByText(/thank/i)).toBeVisible()
  })

  it('sends a valid story as JSON containing title, email and summary', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)

    expect(postCalls()).toHaveLength(1)
    const [, init] = postCalls()[0]
    expect(JSON.parse(init.body)).toMatchObject(VALID_STORY)
  })

  it('empties the form after a successful submission', async () => {
    const { user } = await renderLoadedApp()
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)
    await screen.findByText(/thank/i)
    expect(getStoryFields().title).toHaveValue('')
    expect(getStoryFields().email).toHaveValue('')
    expect(getStoryFields().summary).toHaveValue('')
  })
})
