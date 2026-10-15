import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import {
  getArticlesRegion, getBookmarkButton, getCategorySelect, getSearchBox, getSortSelect,
  renderLoadedApp, visibleTitles,
} from '../test/helpers'
import { ARTICLES, TITLES_A_TO_Z, TITLES_NEWEST_FIRST, TITLES_OLDEST_FIRST } from '../test/fixtures'

// Every assertion after a user action is SYNCHRONOUS on purpose:
// the ticket says the list must update "immediately" (no debounce, no spinner).

describe('Happy path — AC1: the interface is clearly accessible', () => {
  it('has a single top-level heading naming the interface', async () => {
    await renderLoadedApp()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('renders every article from the API as a list item with a title heading', async () => {
    await renderLoadedApp()
    expect(within(getArticlesRegion()).getAllByRole('listitem')).toHaveLength(ARTICLES.length)
    expect(visibleTitles().sort()).toEqual([...TITLES_A_TO_Z].sort())
  })

  it('shows newest articles first by default', async () => {
    await renderLoadedApp()
    expect(visibleTitles()).toEqual(TITLES_NEWEST_FIRST)
  })
})

describe('Happy path — search', () => {
  it('filters the list immediately as the user types', async () => {
    const { user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'chip')
    expect(visibleTitles()).toEqual(['New chip doubles battery life'])
  })

  it('is case-insensitive', async () => {
    const { user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'SENATE')
    expect(visibleTitles()).toEqual(['Senate passes climate bill'])
  })

  it('restores the full list when the search is cleared', async () => {
    const { user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'chip')
    await user.clear(getSearchBox())
    expect(visibleTitles()).toEqual(TITLES_NEWEST_FIRST)
  })
})

describe('Happy path — category filter', () => {
  it('shows only the chosen category immediately', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getCategorySelect(), 'Tech')
    expect(visibleTitles()).toEqual(['New chip doubles battery life', 'Startup raises record funding'])
  })

  it('offers an "all" option that restores every article', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getCategorySelect(), 'Sports')
    await user.selectOptions(getCategorySelect(), 'all')
    expect(visibleTitles()).toEqual(TITLES_NEWEST_FIRST)
  })

  it('combines with search', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getCategorySelect(), 'Tech')
    await user.type(getSearchBox(), 'startup')
    expect(visibleTitles()).toEqual(['Startup raises record funding'])
  })
})

describe('Happy path — sort', () => {
  it('sorts oldest first', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getSortSelect(), 'oldest')
    expect(visibleTitles()).toEqual(TITLES_OLDEST_FIRST)
  })

  it('sorts by title A–Z', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getSortSelect(), 'title')
    expect(visibleTitles()).toEqual(TITLES_A_TO_Z)
  })

  it('keeps the active filter when the sort changes', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getCategorySelect(), 'Politics')
    await user.selectOptions(getSortSelect(), 'oldest')
    expect(visibleTitles()).toEqual(['Election results delayed', 'Senate passes climate bill'])
  })
})

describe('Happy path — bookmark toggle', () => {
  it('toggles aria-pressed immediately on click', async () => {
    const { user } = await renderLoadedApp()
    const button = getBookmarkButton('Senate passes climate bill')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('only affects the article that was clicked', async () => {
    const { user } = await renderLoadedApp()
    await user.click(getBookmarkButton('Senate passes climate bill'))
    expect(getBookmarkButton('Election results delayed')).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps a bookmark when the list is filtered and unfiltered', async () => {
    const { user } = await renderLoadedApp()
    await user.click(getBookmarkButton('Senate passes climate bill'))
    await user.type(getSearchBox(), 'chip')
    await user.clear(getSearchBox())
    expect(getBookmarkButton('Senate passes climate bill')).toHaveAttribute('aria-pressed', 'true')
  })
})
