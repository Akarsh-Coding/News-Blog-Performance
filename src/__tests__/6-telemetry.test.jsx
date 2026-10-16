import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { fillStory, getBookmarkButton, getCategorySelect, getSearchBox, getSortSelect, getStoryFields, renderLoadedApp } from '../test/helpers'
import { ANALYTICS_MESSAGE, VALID_STORY } from '../test/fixtures'

let logSpy
const analyticsCount = () => logSpy.mock.calls.filter((args) => args[0] === ANALYTICS_MESSAGE).length

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('Telemetry (NFR) — "[Analytics] User interacted with Performance Optimization"', () => {
  it('does not log anything just because the page loaded', async () => {
    await renderLoadedApp()
    expect(analyticsCount()).toBe(0)
  })

  it('logs when the user searches', async () => {
    const { user } = await renderLoadedApp()
    await user.click(getSearchBox())
    await user.paste('chip')
    expect(analyticsCount()).toBeGreaterThanOrEqual(1)
  })

  it('logs exactly once when the user changes the category', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getCategorySelect(), 'Tech')
    expect(analyticsCount()).toBe(1)
  })

  it('logs exactly once when the user changes the sort order', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getSortSelect(), 'oldest')
    expect(analyticsCount()).toBe(1)
  })

  it('logs once per bookmark toggle (on and off)', async () => {
    const { user } = await renderLoadedApp()
    await user.click(getBookmarkButton('Senate passes climate bill'))
    expect(analyticsCount()).toBe(1)
    await user.click(getBookmarkButton('Senate passes climate bill'))
    expect(analyticsCount()).toBe(2)
  })

  it('logs once when a valid story is submitted successfully', async () => {
    const { user } = await renderLoadedApp()
    const { submit } = await fillStory(user, VALID_STORY)
    const before = analyticsCount()
    await user.click(submit)
    await waitFor(() => expect(analyticsCount()).toBe(before + 1))
  })

  it('does NOT log when validation blocks a submission (action not completed)', async () => {
    const { user } = await renderLoadedApp()
    await user.click(getStoryFields().submit)
    expect(analyticsCount()).toBe(0)
  })

  it('uses the exact message, via console.log', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getCategorySelect(), 'Sports')
    expect(logSpy).toHaveBeenCalledWith(ANALYTICS_MESSAGE)
  })

  it('does NOT log when the submission fails (the action did not complete)', async () => {
    const { user } = await renderLoadedApp({ failPost: true })
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)
    await screen.findByRole('alert')
    expect(analyticsCount()).toBe(0)
  })

  it('logs ONLY the fixed message: no search text, titles or emails (no PII in telemetry)', async () => {
    const { user, releasePost } = await renderLoadedApp({ holdPost: true })
    await user.click(getSearchBox())
    await user.paste('climate')
    await user.click(getBookmarkButton('Senate passes climate bill'))
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)
    await releasePost()
    await screen.findByText(/thank/i)

    expect(logSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
    for (const args of logSpy.mock.calls) {
      expect(args).toEqual([ANALYTICS_MESSAGE])
    }
  })
})
