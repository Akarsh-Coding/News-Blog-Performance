import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { fillTip, getTipFields, queryLoadingIndicator, renderApp, renderLoadedApp, visibleTitles } from '../test/helpers'
import { TITLES_NEWEST_FIRST, VALID_TIP } from '../test/fixtures'

describe('Unhappy path — bad connectivity (3G)', () => {
  it('shows a visible loading indicator while the initial fetch is pending', () => {
    renderApp({ holdArticles: true })
    const indicator = queryLoadingIndicator()
    expect(indicator).not.toBeNull()
    expect(indicator).toBeVisible()
  })

  it('shows ONLY the loading state (no "No data found", no articles) while the fetch is pending', () => {
    renderApp({ holdArticles: true })
    // Positive assertion first: a blank page must not be able to satisfy this test.
    expect(queryLoadingIndicator()).not.toBeNull()
    expect(screen.queryByText(/no data found/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('replaces the loading indicator with the articles once the slow fetch resolves', async () => {
    const { releaseArticles } = renderApp({ holdArticles: true })
    expect(queryLoadingIndicator()).not.toBeNull()
    await releaseArticles()
    await waitFor(() => expect(queryLoadingIndicator()).toBeNull())
    expect(visibleTitles()).toEqual(TITLES_NEWEST_FIRST)
  })

  it('shows a loading indicator and disables submit while a tip is being sent', async () => {
    const { user, releasePost } = await renderLoadedApp({ holdPost: true })
    const { submit } = await fillTip(user, VALID_TIP)
    await user.click(submit)

    await waitFor(() => expect(queryLoadingIndicator()).not.toBeNull())
    expect(getTipFields().submit).toBeDisabled()

    await releasePost()
    await waitFor(() => expect(queryLoadingIndicator()).toBeNull())
  })

  it('confirms success once the slow submission completes', async () => {
    const { user, releasePost } = await renderLoadedApp({ holdPost: true })
    const { submit } = await fillTip(user, VALID_TIP)
    await user.click(submit)
    await releasePost()
    expect(await screen.findByText(/thank/i)).toBeVisible()
  })

  it('does not send the same tip twice if the user clicks submit repeatedly while it is pending', async () => {
    const { user, postCalls } = await renderLoadedApp({ holdPost: true })
    const { submit } = await fillTip(user, VALID_TIP)
    await user.click(submit)
    await user.click(submit)
    await user.click(submit)
    expect(postCalls()).toHaveLength(1)
  })
})
