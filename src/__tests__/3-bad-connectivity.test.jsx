import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { fillStory, getStoryFields, queryLoadingIndicator, renderApp, renderLoadedApp, visibleTitles } from '../test/helpers'
import { TITLES_NEWEST_FIRST, VALID_STORY } from '../test/fixtures'

const getRetryButton = () => screen.getByRole('button', { name: /retry/i })

describe('Unhappy path — bad connectivity: slow requests', () => {
  it('shows a visible loading indicator while the initial fetch is pending', () => {
    renderApp({ holdArticles: true })
    const indicator = queryLoadingIndicator()
    expect(indicator).not.toBeNull()
    expect(indicator).toBeVisible()
  })

  it('shows ONLY the loading state (no "No data found", no articles, no error) while the fetch is pending', () => {
    renderApp({ holdArticles: true })
    // Positive assertion first: a blank page must not be able to satisfy this test.
    expect(queryLoadingIndicator()).not.toBeNull()
    expect(screen.queryByText(/no data found/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('replaces the loading indicator with the articles once the slow fetch resolves', async () => {
    const { releaseArticles } = renderApp({ holdArticles: true })
    expect(queryLoadingIndicator()).not.toBeNull()
    await releaseArticles()
    await waitFor(() => expect(queryLoadingIndicator()).toBeNull())
    expect(visibleTitles()).toEqual(TITLES_NEWEST_FIRST)
  })

  it('shows a loading indicator and disables submit while a story is being sent', async () => {
    const { user, releasePost } = await renderLoadedApp({ holdPost: true })
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)

    await waitFor(() => expect(queryLoadingIndicator()).not.toBeNull())
    expect(getStoryFields().submit).toBeDisabled()

    await releasePost()
    await waitFor(() => expect(queryLoadingIndicator()).toBeNull())
  })

  it('confirms success once the slow submission completes', async () => {
    const { user, releasePost } = await renderLoadedApp({ holdPost: true })
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)
    await releasePost()
    expect(await screen.findByText(/thank/i)).toBeVisible()
  })

  it('does not send the same story twice if the user clicks submit repeatedly while it is pending', async () => {
    const { user, postCalls } = await renderLoadedApp({ holdPost: true })
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)
    await user.click(submit)
    await user.click(submit)
    expect(postCalls()).toHaveLength(1)
  })
})

describe('Unhappy path — bad connectivity: failed requests', () => {
  it('shows an error message with a Retry button when the articles request fails', async () => {
    renderApp({ failArticles: 1 })
    expect(await screen.findByRole('alert')).toHaveTextContent(/load the articles/i)
    expect(getRetryButton()).toBeVisible()
    expect(queryLoadingIndicator()).toBeNull()
  })

  it('treats an HTTP 500 as a failure too', async () => {
    renderApp({ failArticles: 1, failureMode: 'http' })
    expect(await screen.findByRole('alert')).toHaveTextContent(/load the articles/i)
    expect(getRetryButton()).toBeVisible()
  })

  it('does not confuse a failed request with an empty result ("No data found")', async () => {
    renderApp({ failArticles: 1 })
    await screen.findByRole('alert')
    expect(screen.queryByText(/no data found/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('Retry shows the loading indicator again, then the articles', async () => {
    const { user, releaseArticles } = renderApp({ failArticles: 1, holdArticles: true })
    await screen.findByRole('alert')

    await user.click(getRetryButton())
    expect(queryLoadingIndicator()).not.toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await releaseArticles()
    await waitFor(() => expect(visibleTitles()).toEqual(TITLES_NEWEST_FIRST))
    expect(queryLoadingIndicator()).toBeNull()
  })

  it('keeps showing the error if Retry fails again', async () => {
    const { user } = renderApp({ failArticles: 2 })
    await screen.findByRole('alert')
    await user.click(getRetryButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(/load the articles/i)
    expect(getRetryButton()).toBeVisible()
  })

  it('a failed submission shows an error, keeps what the user typed, and re-enables the button', async () => {
    const { user } = await renderLoadedApp({ failPost: true })
    const { submit } = await fillStory(user, VALID_STORY)
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(/submit your story/i)
    expect(getStoryFields().title).toHaveValue(VALID_STORY.title)
    expect(getStoryFields().submit).toBeEnabled()
    expect(queryLoadingIndicator()).toBeNull()
  })
})
