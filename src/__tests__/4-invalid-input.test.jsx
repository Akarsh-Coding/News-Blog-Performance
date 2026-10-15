import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { fillTip, getTipFields, renderLoadedApp } from '../test/helpers'
import { VALID_TIP } from '../test/fixtures'

const isFlagged = (field) => field.getAttribute('aria-invalid') === 'true'
const looksRed = (field) => /error|invalid/i.test(field.className)

describe('Unhappy path — invalid input on the "Submit a tip" form', () => {
  it('blocks submission and flags every field when the form is empty', async () => {
    const { user, postCalls } = await renderLoadedApp()
    await user.click(getTipFields().submit)

    expect(postCalls()).toHaveLength(0)
    const { name, email, tip } = getTipFields()
    for (const field of [name, email, tip]) {
      expect(field).toHaveAttribute('aria-invalid', 'true')
      expect(looksRed(field)).toBe(true)
      expect(field).toHaveAccessibleDescription(/required/i)
    }
  })

  it('blocks a malformed email and flags only that field', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillTip(user, { ...VALID_TIP, email: 'not-an-email' })
    await user.click(submit)

    expect(postCalls()).toHaveLength(0)
    const { name, email, tip } = getTipFields()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription(/valid email/i)
    expect(isFlagged(name)).toBe(false)
    expect(isFlagged(tip)).toBe(false)
  })

  it('blocks a tip shorter than 10 characters', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillTip(user, { ...VALID_TIP, tip: 'too short' })
    await user.click(submit)

    expect(postCalls()).toHaveLength(0)
    expect(getTipFields().tip).toHaveAttribute('aria-invalid', 'true')
    expect(getTipFields().tip).toHaveAccessibleDescription(/10 characters/i)
  })

  it('treats a whitespace-only name as missing', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillTip(user, { ...VALID_TIP, name: '    ' })
    await user.click(submit)

    expect(postCalls()).toHaveLength(0)
    expect(getTipFields().name).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not show error states before the user has tried to submit', async () => {
    await renderLoadedApp()
    const { name, email, tip } = getTipFields()
    for (const field of [name, email, tip]) {
      expect(isFlagged(field)).toBe(false)
      expect(looksRed(field)).toBe(false)
    }
  })

  it('submits once the user corrects the fields, and clears the error states', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillTip(user, { ...VALID_TIP, email: 'nope' })
    await user.click(submit)
    expect(postCalls()).toHaveLength(0)

    await user.clear(getTipFields().email)
    await user.type(getTipFields().email, VALID_TIP.email)
    await user.click(submit)

    expect(postCalls()).toHaveLength(1)
    expect(await screen.findByText(/thank/i)).toBeVisible()
  })

  it('sends a valid tip as JSON containing name, email and tip', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillTip(user, VALID_TIP)
    await user.click(submit)

    expect(postCalls()).toHaveLength(1)
    const [, init] = postCalls()[0]
    expect(JSON.parse(init.body)).toMatchObject(VALID_TIP)
  })
})
