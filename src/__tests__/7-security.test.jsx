import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { enter, fillTip, getSearchBox, getTipFields, renderLoadedApp } from '../test/helpers'
import { VALID_TIP, XSS_PAYLOAD } from '../test/fixtures'

// A controlled <input> shows exactly what is held in state, so asserting on
// input.value is how we verify "sanitized BEFORE it is stored in state".
// Either stripping or escaping is acceptable; raw angle brackets are not.
const hasNoMarkup = (value) => !/[<>]/.test(value)

const PAYLOADS = [
  XSS_PAYLOAD,
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)<b>',
]

describe('Security (NFR) — XSS sanitization of text inputs', () => {
  it.each(PAYLOADS)('strips/escapes markup typed into search: %s', async (payload) => {
    const { user } = await renderLoadedApp()
    await enter(user, getSearchBox(), payload)
    expect(hasNoMarkup(getSearchBox().value)).toBe(true)
  })

  it('does not inject a <script> element or run it', async () => {
    const alertSpy = vi.fn()
    vi.stubGlobal('alert', alertSpy)
    const { user, container } = await renderLoadedApp()
    await enter(user, getSearchBox(), XSS_PAYLOAD)
    expect(container.querySelector('script')).toBeNull()
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('does not echo raw markup anywhere in the rendered page', async () => {
    const { user, container } = await renderLoadedApp()
    await enter(user, getSearchBox(), '<img src=x onerror=alert(1)>')
    expect(container.querySelector('img[onerror]')).toBeNull()
  })

  it('leaves ordinary search text untouched', async () => {
    const { user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'climate bill')
    expect(getSearchBox()).toHaveValue('climate bill')
  })

  it.each(['name', 'email', 'tip'])('sanitizes the "%s" field of the tip form', async (field) => {
    const { user } = await renderLoadedApp()
    await enter(user, getTipFields()[field], `${XSS_PAYLOAD}Bob`)
    const value = getTipFields()[field].value
    expect(hasNoMarkup(value)).toBe(true)
    if (field !== 'email') expect(value).toContain('Bob') // real text survives
  })

  it('never sends markup to the server', async () => {
    const { user, postCalls } = await renderLoadedApp()
    const { submit } = await fillTip(user, {
      name: `${XSS_PAYLOAD}Priya`,
      email: VALID_TIP.email,
      tip: `${XSS_PAYLOAD}The council is meeting tonight.`,
    })
    await user.click(submit)

    expect(postCalls()).toHaveLength(1)
    const body = postCalls()[0][1].body
    expect(hasNoMarkup(body)).toBe(true)
    expect(await screen.findByText(/thank/i)).toBeVisible()
  })
})
