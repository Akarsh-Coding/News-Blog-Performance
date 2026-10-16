import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { fillStory, getBookmarkButton, getCategorySelect, getSearchBox, getSortSelect, getStoryFields, renderApp, renderLoadedApp } from '../test/helpers'
import { ARTICLES, VALID_STORY } from '../test/fixtures'

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
    await user.click(getStoryFields().submit)
    expect(getStoryFields().title).toHaveAttribute('aria-invalid', 'true')
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
      ...Object.values(getStoryFields()).filter((el) => el.tagName !== 'FORM'),
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
    await fillStory(user, VALID_STORY)
    getStoryFields().submit.focus()
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

describe('Accessibility (NFR) — landmarks, skip link, live regions', () => {
  it('groups search, category and sort in a labelled search landmark', async () => {
    await renderLoadedApp()
    const search = screen.getByRole('search', { name: /search and filter articles/i })
    expect(within(search).getByRole('searchbox')).toBe(getSearchBox())
    expect(within(search).getAllByRole('combobox')).toHaveLength(2)
  })

  it('has a skip link as the FIRST Tab stop, pointing at the story form', async () => {
    const { user } = await renderLoadedApp()
    await user.tab()
    expect(document.activeElement).toHaveAccessibleName(/skip to the submit a story form/i)
    expect(document.activeElement).toHaveAttribute('href', '#story-title')
    expect(document.getElementById('story-title')).toBe(getStoryFields().title) // target exists and is focusable
  })

  it('announces loading politely, from a live region that exists BEFORE the text does', async () => {
    const { releaseArticles } = renderApp({ holdArticles: true })
    const region = screen.getByText(/loading articles/i).closest('[aria-live]')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('role', 'status')

    await releaseArticles()
    await waitFor(() => expect(screen.queryByText(/loading articles/i)).not.toBeInTheDocument())
    expect(region).toBeInTheDocument() // the same DOM node survived: it is persistent
  })

  it('announces the match count and the empty state through that same live region', async () => {
    const { user } = await renderLoadedApp()
    const region = screen.getByText(/showing 6 of 6 articles/i).closest('[aria-live]')

    await user.type(getSearchBox(), 'chip')
    expect(region).toHaveTextContent(/showing 1 of 6 articles/i)

    await user.clear(getSearchBox())
    await user.type(getSearchBox(), 'zzzz')
    expect(within(region).getByText(/no data found/i)).toBeVisible()
  })

  it('announces form progress through a persistent live region inside the form', async () => {
    const { user, releasePost } = await renderLoadedApp({ holdPost: true })
    const region = getStoryFields().form.querySelector('[aria-live="polite"]')
    expect(region).toHaveAttribute('role', 'status')
    expect(region).toBeEmptyDOMElement()

    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)
    expect(region).toHaveTextContent(/submitting your story/i)

    await releasePost()
    await waitFor(() => expect(region).toHaveTextContent(/thank you/i))
  })

  it('never puts aria-busy on an ancestor of a live region (that would silence it)', async () => {
    const { container, user } = await renderLoadedApp({ holdPost: true })
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)
    expect(container.querySelector('[aria-busy="true"] [aria-live]')).toBeNull()
  })

  it('gives the Retry button a descriptive accessible name', async () => {
    renderApp({ failArticles: 1 })
    expect(await screen.findByRole('button', { name: 'Retry loading articles' })).toBeVisible()
  })

  it('has no axe violations while loading', async () => {
    const { container } = renderApp({ holdArticles: true })
    expect(screen.getByText(/loading articles/i)).toBeVisible()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations in the error state (alert + Retry)', async () => {
    const { container } = renderApp({ failArticles: 1 })
    await screen.findByRole('alert')
    expect(await axe(container)).toHaveNoViolations()
  })
})
