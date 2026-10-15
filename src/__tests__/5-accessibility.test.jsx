import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { fillTip, getBookmarkButton, getCategorySelect, getSearchBox, getSortSelect, getTipFields, renderLoadedApp } from '../test/helpers'
import { ARTICLES, VALID_TIP } from '../test/fixtures'

expect.extend(toHaveNoViolations)

const INTERACTIVE_ROLES = ['button', 'textbox', 'searchbox', 'combobox', 'link', 'checkbox', 'radio', 'switch', 'tab']

describe('Accessibility (NFR) — ARIA labels', () => {
  it('gives every interactive element an accessible name', async () => {
    await renderLoadedApp()
    const interactive = INTERACTIVE_ROLES.flatMap((role) => screen.queryAllByRole(role))

    // search + 2 selects + 6 bookmarks + 3 form fields + submit = 13 minimum.
    // Guards against a vacuous pass on an almost-empty page.
    expect(interactive.length).toBeGreaterThanOrEqual(13)
    for (const element of interactive) {
      expect(element).toHaveAccessibleName()
    }
  })

  it('names each bookmark button after its article and exposes state via aria-pressed', async () => {
    await renderLoadedApp()
    for (const { title } of ARTICLES) {
      expect(getBookmarkButton(title)).toHaveAttribute('aria-pressed')
    }
  })

  it('has no axe violations (empty form)', async () => {
    const { container } = await renderLoadedApp()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations (form showing validation errors)', async () => {
    const { container, user } = await renderLoadedApp()
    await user.click(getTipFields().submit)
    expect(getTipFields().name).toHaveAttribute('aria-invalid', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations (empty-state view)', async () => {
    const { container, user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'zzzz')
    expect(screen.getByText(/no data found/i)).toBeVisible()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Accessibility (NFR) — keyboard navigable', () => {
  it('lets a keyboard user Tab to every control', async () => {
    const { user } = await renderLoadedApp()
    const reached = new Set()
    for (let i = 0; i < 40; i += 1) {
      await user.tab()
      reached.add(document.activeElement)
    }
    const expected = [
      getSearchBox(), getCategorySelect(), getSortSelect(),
      ...ARTICLES.map((a) => getBookmarkButton(a.title)),
      ...Object.values(getTipFields()).filter((el) => el.tagName !== 'FORM'),
    ]
    for (const element of expected) {
      expect(reached.has(element)).toBe(true)
    }
  })

  it('toggles a bookmark with Enter and with Space', async () => {
    const { user } = await renderLoadedApp()
    const button = getBookmarkButton('Marathon record broken')
    button.focus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard(' ')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('submits the form from the keyboard (Enter on the submit button)', async () => {
    const { user, postCalls } = await renderLoadedApp()
    await fillTip(user, VALID_TIP)
    getTipFields().submit.focus()
    await user.keyboard('{Enter}')
    expect(postCalls()).toHaveLength(1)
  })

  it('never uses a positive tabindex (keeps the natural tab order)', async () => {
    const { container } = await renderLoadedApp()
    for (const element of container.querySelectorAll('[tabindex]')) {
      expect(Number(element.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
    }
  })

  it('keeps focus visible on the bookmark after toggling (focus is not lost)', async () => {
    const { user } = await renderLoadedApp()
    const button = getBookmarkButton('Senate passes climate bill')
    await user.click(button)
    expect(button).toHaveFocus()
  })
})
