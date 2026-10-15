import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../App'
import { ARTICLES } from './fixtures'

/* ---------- network stub (implementation-agnostic: only global fetch) ---------- */

export function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const jsonResponse = (body) => ({
  ok: true,
  status: 200,
  json: async () => body,
  text: async () => JSON.stringify(body),
})

const methodOf = (init) => (init?.method ?? 'GET').toUpperCase()

/**
 * GET (any URL)  -> resolves with `articles`
 * POST (any URL) -> resolves with { ok: true }
 * holdArticles / holdPost keep the request pending until released (slow network).
 * failArticles / failureMode / failPost simulate requests that fail.
 */
export function stubFetch({
  articles = ARTICLES,
  holdArticles = false,
  holdPost = false,
  failArticles = 0, // number of initial GETs that fail before one succeeds
  failureMode = 'network', // 'network' (fetch rejects) | 'http' (HTTP 500)
  failPost = false,
} = {}) {
  const articlesGate = deferred()
  const postGate = deferred()
  let remainingFailures = failArticles

  const fetchMock = vi.fn((_url, init) => {
    if (methodOf(init) === 'POST') {
      if (failPost) return Promise.reject(new TypeError('Failed to fetch'))
      return holdPost ? postGate.promise.then(() => jsonResponse({ ok: true })) : Promise.resolve(jsonResponse({ ok: true }))
    }
    if (remainingFailures > 0) {
      remainingFailures -= 1
      return failureMode === 'http'
        ? Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
        : Promise.reject(new TypeError('Failed to fetch'))
    }
    return holdArticles ? articlesGate.promise.then(() => jsonResponse(articles)) : Promise.resolve(jsonResponse(articles))
  })
  vi.stubGlobal('fetch', fetchMock)

  return {
    fetchMock,
    postCalls: () => fetchMock.mock.calls.filter(([, init]) => methodOf(init) === 'POST'),
    releaseArticles: () => act(async () => articlesGate.resolve()),
    releasePost: () => act(async () => postGate.resolve()),
  }
}

/* ---------- rendering ---------- */

/** Renders <App /> and waits until the article list has loaded. */
export async function renderLoadedApp(options) {
  const user = userEvent.setup()
  const network = stubFetch(options)
  const utils = render(<App />)
  await screen.findAllByRole('listitem')
  return { user, ...network, ...utils }
}

/** Renders <App /> without waiting (for loading-state tests). */
export function renderApp(options) {
  const user = userEvent.setup()
  const network = stubFetch(options)
  const utils = render(<App />)
  return { user, ...network, ...utils }
}

/* ---------- element queries (the "contract" in code form) ---------- */

export const getSearchBox = () => screen.getByRole('searchbox', { name: /search articles/i })
export const getCategorySelect = () => screen.getByRole('combobox', { name: /category/i })
export const getSortSelect = () => screen.getByRole('combobox', { name: /sort/i })
export const getArticlesRegion = () => screen.getByRole('region', { name: /articles/i })
export const getBookmarkButton = (title) => screen.getByRole('button', { name: `Bookmark ${title}` })

export const visibleTitles = () =>
  within(getArticlesRegion())
    .queryAllByRole('listitem')
    .map((li) => within(li).getByRole('heading').textContent)

export const getStoryFields = () => ({
  form: screen.getByRole('form', { name: /submit a story/i }),
  title: screen.getByRole('textbox', { name: /^title/i }),
  email: screen.getByRole('textbox', { name: /^author email/i }),
  summary: screen.getByRole('textbox', { name: /^summary/i }),
  submit: screen.getByRole('button', { name: /submit story/i }),
})

/** Any element with role=status whose text reads like a loading/submitting message. */
export const queryLoadingIndicator = () =>
  screen.queryAllByRole('status').find((el) => /loading|submitting|sending|saving/i.test(el.textContent ?? '')) ?? null

/* ---------- interactions ---------- */

/** Click + paste: one input event, so the value lands exactly as given (safe for "<" characters). */
export async function enter(user, element, text) {
  await user.click(element)
  await user.paste(text)
}

export async function fillStory(user, { title, email, summary } = {}) {
  const fields = getStoryFields()
  if (title !== undefined) await enter(user, fields.title, title)
  if (email !== undefined) await enter(user, fields.email, email)
  if (summary !== undefined) await enter(user, fields.summary, summary)
  return fields
}
