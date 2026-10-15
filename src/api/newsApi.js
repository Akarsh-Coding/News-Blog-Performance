/*
 * Network layer for the news explorer.
 *
 * With VITE_SIMULATE_BACKEND !== 'false' (the default for dev and the deployed
 * demo) requests behave like a slow 3G connection: every request waits 2-3
 * seconds, and failures can be triggered from the URL:
 *
 *   ?simulate=error    first article load fails, "Retry" then succeeds
 *   ?simulate=offline  every request fails (articles and story submission)
 *
 * The test run sets VITE_SIMULATE_BACKEND=false (see vite.config.js) so the
 * suite exercises the plain fetch path without real delays.
 */
const SIMULATE_BACKEND = import.meta.env.VITE_SIMULATE_BACKEND !== 'false'

const ARTICLES_URL = `${import.meta.env.BASE_URL}articles.json`
const STORIES_URL = `${import.meta.env.BASE_URL}api/stories`

export const LATENCY_RANGE_MS = [2000, 3000]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const randomLatency = ([min, max]) => min + Math.random() * (max - min)

export const readFailureMode = () => new URLSearchParams(window.location.search).get('simulate')

async function simulateNetwork({ failNow }) {
  await wait(randomLatency(LATENCY_RANGE_MS))
  if (failNow) throw new Error('Simulated network failure')
}

async function parseOrThrow(response) {
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json()
}

/** `attempt` is 0 for the first load and increases with every Retry. */
export async function loadArticles({ attempt = 0, simulate = SIMULATE_BACKEND, failureMode = readFailureMode() } = {}) {
  if (simulate) {
    await simulateNetwork({ failNow: failureMode === 'offline' || (failureMode === 'error' && attempt === 0) })
  }
  return parseOrThrow(await fetch(ARTICLES_URL))
}

export async function submitStory(story, { simulate = SIMULATE_BACKEND, failureMode = readFailureMode() } = {}) {
  if (simulate) {
    // This project has no server: the simulated backend just accepts the story.
    await simulateNetwork({ failNow: failureMode === 'offline' })
    return { ...story }
  }
  return parseOrThrow(
    await fetch(STORIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(story),
    }),
  )
}
