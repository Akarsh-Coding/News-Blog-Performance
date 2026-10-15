import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { loadArticles, submitStory } from '../api/newsApi'
import { ARTICLES, VALID_STORY } from '../test/fixtures'

const ok = (body) => ({ ok: true, status: 200, json: async () => body })

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn(async () => ok(ARTICLES)))
})

afterEach(() => {
  vi.useRealTimers()
})

/** Resolves/rejects state of a promise without awaiting it. */
function track(promise) {
  const state = { settled: false }
  promise.then(
    () => { state.settled = true },
    () => { state.settled = true },
  )
  return state
}

describe('loadArticles — simulated slow network', () => {
  it('waits at least 2 seconds (fastest case)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const request = loadArticles({ simulate: true, failureMode: null })
    const state = track(request)

    await vi.advanceTimersByTimeAsync(1999)
    expect(state.settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(request).resolves.toEqual(ARTICLES)
  })

  it('never waits much longer than 3 seconds (slowest case)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999)
    const request = loadArticles({ simulate: true, failureMode: null })
    const state = track(request)

    await vi.advanceTimersByTimeAsync(2998)
    expect(state.settled).toBe(false)

    await vi.advanceTimersByTimeAsync(2)
    await expect(request).resolves.toEqual(ARTICLES)
  })

  it('does not add any delay when simulation is off', async () => {
    await expect(loadArticles({ simulate: false })).resolves.toEqual(ARTICLES)
  })

  it('?simulate=error: the first attempt fails after the delay, the retry succeeds', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = expect(loadArticles({ simulate: true, failureMode: 'error', attempt: 0 })).rejects.toThrow(/simulated/i)
    await vi.advanceTimersByTimeAsync(2000)
    await first

    const retry = loadArticles({ simulate: true, failureMode: 'error', attempt: 1 })
    await vi.advanceTimersByTimeAsync(2000)
    await expect(retry).resolves.toEqual(ARTICLES)
  })

  it('?simulate=offline: every attempt fails', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const retry = expect(loadArticles({ simulate: true, failureMode: 'offline', attempt: 3 })).rejects.toThrow(/simulated/i)
    await vi.advanceTimersByTimeAsync(2000)
    await retry
  })

  it('rejects when the server answers with an HTTP error', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
    await expect(loadArticles({ simulate: false })).rejects.toThrow(/503/)
  })
})

describe('submitStory', () => {
  it('simulated: takes 2-3 seconds and accepts the story', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const request = submitStory(VALID_STORY, { simulate: true, failureMode: null })
    const state = track(request)

    await vi.advanceTimersByTimeAsync(1999)
    expect(state.settled).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await expect(request).resolves.toMatchObject(VALID_STORY)
    expect(fetch).not.toHaveBeenCalled() // no server in the simulated backend
  })

  it('simulated + ?simulate=offline: fails', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const request = expect(submitStory(VALID_STORY, { simulate: true, failureMode: 'offline' })).rejects.toThrow(/simulated/i)
    await vi.advanceTimersByTimeAsync(2000)
    await request
  })

  it('real mode: POSTs JSON via fetch', async () => {
    fetch.mockResolvedValueOnce(ok({ id: 1 }))
    await submitStory(VALID_STORY, { simulate: false })
    const [, init] = fetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual(VALID_STORY)
  })
})
