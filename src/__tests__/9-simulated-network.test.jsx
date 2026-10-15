import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import realArticles from '../../public/articles.json'

/*
 * End-to-end check of the simulated 3G backend, as a user sees it in the browser:
 * the real <App />, the real 240-article dataset, fake timers, simulation ON.
 * (The rest of the suite runs with the simulation off so it stays fast.)
 */
const advance = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

async function renderSimulatedApp(search = '') {
  vi.stubEnv('VITE_SIMULATE_BACKEND', 'true')
  vi.resetModules()
  window.history.pushState({}, '', `/${search}`)
  const { default: App } = await import('../App')
  return render(<App />)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // 2.5 s: the middle of the 2-3 s range
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => realArticles })))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  window.history.pushState({}, '', '/')
})

describe('Simulated 3G backend (end to end)', () => {
  it('shows "Loading articles…" for 2-3 seconds, then all 240 articles', async () => {
    await renderSimulatedApp()
    expect(screen.getByRole('status')).toHaveTextContent(/loading articles/i)

    await advance(2400)
    expect(screen.getByRole('status')).toHaveTextContent(/loading articles/i)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)

    await advance(100)
    expect(screen.getAllByRole('listitem')).toHaveLength(240)
    expect(screen.queryByText(/loading articles/i)).not.toBeInTheDocument()
  })

  it('?simulate=error: fails after the delay, then Retry loads the articles', async () => {
    await renderSimulatedApp('?simulate=error')
    await advance(2500)
    expect(screen.getByRole('alert')).toHaveTextContent(/load the articles/i)

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/loading articles/i)

    await advance(2500)
    expect(screen.getAllByRole('listitem')).toHaveLength(240)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('?simulate=offline: Retry keeps failing', async () => {
    await renderSimulatedApp('?simulate=offline')
    await advance(2500)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    await advance(2500)
    expect(screen.getByRole('alert')).toHaveTextContent(/load the articles/i)
  })
})
