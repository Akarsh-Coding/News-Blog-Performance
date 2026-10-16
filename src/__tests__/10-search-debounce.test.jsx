import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { ARTICLES } from '../test/fixtures'

/*
 * The rest of the suite runs with the search debounce at 0 ms so assertions stay
 * synchronous. THIS file turns the real 300 ms debounce on and checks it through
 * the real <App />, with fake timers.
 */
const { filterSpy } = vi.hoisted(() => ({ filterSpy: vi.fn() }))

vi.mock('../utils/filterArticles', async (importActual) => {
  const actual = await importActual()
  return {
    ...actual,
    filterAndSortArticles: (...args) => {
      filterSpy(...args)
      return actual.filterAndSortArticles(...args)
    },
  }
})

const advance = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
const type = (value) => fireEvent.change(screen.getByRole('searchbox', { name: /search articles/i }), { target: { value } })
const titles = () =>
  within(screen.getByRole('region', { name: /articles/i }))
    .queryAllByRole('heading')
    .map((heading) => heading.textContent)

async function renderWithDebounce() {
  vi.stubEnv('VITE_SEARCH_DEBOUNCE_MS', '300')
  vi.resetModules()
  const { default: App } = await import('../App')
  render(<App />)
  await advance(0) // let the stubbed fetch resolve
  expect(titles()).toHaveLength(ARTICLES.length)
}

beforeEach(() => {
  vi.useFakeTimers()
  filterSpy.mockClear()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ARTICLES })))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('Search debounce (300 ms)', () => {
  it('the input shows every keystroke immediately, but the list waits for typing to pause', async () => {
    await renderWithDebounce()
    for (const text of ['c', 'ch', 'chi', 'chip']) type(text)

    expect(screen.getByRole('searchbox')).toHaveValue('chip') // no lag while typing
    expect(titles()).toHaveLength(ARTICLES.length) // list not recomputed yet

    await advance(299)
    expect(titles()).toHaveLength(ARTICLES.length)

    await advance(1)
    expect(titles()).toEqual(['New chip doubles battery life'])
  })

  it('a burst of keystrokes computes the list once, not once per keystroke', async () => {
    await renderWithDebounce()
    const before = filterSpy.mock.calls.length

    for (const text of ['c', 'ch', 'chi', 'chip']) type(text)
    await advance(300)

    expect(filterSpy.mock.calls.length - before).toBe(1)
    expect(filterSpy).toHaveBeenLastCalledWith(expect.any(Array), expect.objectContaining({ query: 'chip' }))
  })

  it('each new keystroke restarts the wait', async () => {
    await renderWithDebounce()
    type('chip')
    await advance(200)
    type('chips') // pause was only 200 ms: timer restarts
    await advance(200)
    expect(titles()).toHaveLength(ARTICLES.length) // still not applied (400 ms after "chip", 200 after "chips")

    await advance(100)
    expect(titles()).toEqual([]) // "chips" matches nothing
    expect(screen.getByText(/no data found/i)).toBeVisible()
  })

  it('does NOT debounce the category or sort controls: they apply immediately', async () => {
    await renderWithDebounce()
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: 'Tech' } })
    expect(titles()).toEqual(['New chip doubles battery life', 'Startup raises record funding'])

    fireEvent.change(screen.getByRole('combobox', { name: /sort/i }), { target: { value: 'oldest' } })
    expect(titles()).toEqual(['Startup raises record funding', 'New chip doubles battery life'])
  })
})
