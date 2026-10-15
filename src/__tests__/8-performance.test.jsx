import { beforeEach, describe, expect, it, vi } from 'vitest'
import { enter, getBookmarkButton, getSearchBox, getStoryFields, renderLoadedApp } from '../test/helpers'
import { ARTICLES } from '../test/fixtures'

/*
 * These tests replace two modules with instrumented versions:
 *   ../components/ArticleCard      -> a React.memo component that counts its renders
 *   ../utils/filterArticles        -> a pure function wrapped in a spy
 *
 * Because the mock card is memo'd, it only avoids re-rendering if the parent
 * passes it referentially-stable props (same article object, stable
 * onToggleBookmark via useCallback). That is exactly what the ticket's
 * "useMemo / useCallback" constraint demands.
 */
const { cardRenders, filterSpy } = vi.hoisted(() => ({ cardRenders: {}, filterSpy: vi.fn() }))

vi.mock('../components/ArticleCard', async () => {
  const React = await import('react')
  const ArticleCard = React.memo(function ArticleCard({ article, isBookmarked, onToggleBookmark }) {
    cardRenders[article.id] = (cardRenders[article.id] ?? 0) + 1
    return React.createElement(
      'li',
      null,
      React.createElement('h2', null, article.title),
      React.createElement(
        'button',
        {
          type: 'button',
          'aria-label': `Bookmark ${article.title}`,
          'aria-pressed': isBookmarked,
          onClick: () => onToggleBookmark(article.id),
        },
        '★',
      ),
    )
  })
  return { default: ArticleCard }
})

vi.mock('../utils/filterArticles', () => ({
  filterAndSortArticles: (articles, options) => {
    filterSpy(articles, options)
    const { query = '', category = 'all', sortBy = 'newest' } = options ?? {}
    const q = query.trim().toLowerCase()
    const sorted = [...articles]
      .filter((a) => (category === 'all' || a.category === category) && (!q || `${a.title} ${a.summary}`.toLowerCase().includes(q)))
      .sort((a, b) => (sortBy === 'title' ? a.title.localeCompare(b.title) : sortBy === 'oldest' ? a.publishedAt.localeCompare(b.publishedAt) : b.publishedAt.localeCompare(a.publishedAt)))
    return sorted
  },
}))

beforeEach(() => {
  for (const key of Object.keys(cardRenders)) delete cardRenders[key]
  filterSpy.mockClear()
})

describe('Performance (NFR) — memoized children', () => {
  it('renders each card (sanity check that the instrumented card is in use)', async () => {
    await renderLoadedApp()
    expect(Object.keys(cardRenders).sort()).toEqual(ARTICLES.map((a) => a.id).sort())
  })

  it('does not re-render any card when unrelated state changes (typing in the story form)', async () => {
    const { user } = await renderLoadedApp()
    const baseline = { ...cardRenders }
    await enter(user, getStoryFields().title, 'Council budget story')
    await enter(user, getStoryFields().summary, 'Something newsworthy happened')
    expect(cardRenders).toEqual(baseline)
  })

  it('does not re-render any card when validation errors appear', async () => {
    const { user } = await renderLoadedApp()
    const baseline = { ...cardRenders }
    await user.click(getStoryFields().submit)
    expect(getStoryFields().title).toHaveAttribute('aria-invalid', 'true')
    expect(cardRenders).toEqual(baseline)
  })

  it('re-renders only the bookmarked card when one bookmark is toggled', async () => {
    const { user } = await renderLoadedApp()
    const baseline = { ...cardRenders }
    await user.click(getBookmarkButton('Senate passes climate bill'))

    expect(cardRenders.a1).toBeGreaterThan(baseline.a1)
    for (const id of ['a2', 'a3', 'a4', 'a5', 'a6']) {
      expect(cardRenders[id]).toBe(baseline[id])
    }
  })
})

describe('Performance (NFR) — memoized filtered-list computation', () => {
  it('computes the list on load', async () => {
    await renderLoadedApp()
    expect(filterSpy).toHaveBeenCalled()
  })

  it('does not re-run when unrelated state changes (story form typing, validation errors)', async () => {
    const { user } = await renderLoadedApp()
    const baseline = filterSpy.mock.calls.length
    expect(baseline).toBeGreaterThan(0)

    await enter(user, getStoryFields().title, 'Council budget story')
    await user.click(getStoryFields().submit)
    expect(filterSpy).toHaveBeenCalledTimes(baseline)
  })

  it('does not re-run when a bookmark is toggled', async () => {
    const { user } = await renderLoadedApp()
    const baseline = filterSpy.mock.calls.length
    await user.click(getBookmarkButton('Senate passes climate bill'))
    expect(filterSpy).toHaveBeenCalledTimes(baseline)
  })

  it('DOES re-run when its real inputs change (proves the spy is wired up)', async () => {
    const { user } = await renderLoadedApp()
    const baseline = filterSpy.mock.calls.length
    await enter(user, getSearchBox(), 'chip')
    expect(filterSpy.mock.calls.length).toBeGreaterThan(baseline)
    expect(filterSpy).toHaveBeenLastCalledWith(expect.any(Array), expect.objectContaining({ query: 'chip' }))
  })
})
