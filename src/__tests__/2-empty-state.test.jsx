import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { getArticlesRegion, getCategorySelect, getSearchBox, queryLoadingIndicator, renderApp, renderLoadedApp } from '../test/helpers'

describe('Unhappy path — empty states (never a blank screen)', () => {
  it('shows a "No data found" message when a search matches nothing', async () => {
    const { user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'zzzz')
    expect(screen.getByText(/no data found/i)).toBeVisible()
    expect(within(getArticlesRegion()).queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows "No data found" when search + category together match nothing', async () => {
    const { user } = await renderLoadedApp()
    await user.selectOptions(getCategorySelect(), 'Tech')
    await user.type(getSearchBox(), 'senate')
    expect(screen.getByText(/no data found/i)).toBeVisible()
  })

  it('keeps the search box and filters on screen so the user can recover', async () => {
    const { user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'zzzz')
    expect(getSearchBox()).toBeVisible()
    expect(getCategorySelect()).toBeVisible()
  })

  it('removes the message and restores the list once the search is cleared', async () => {
    const { user } = await renderLoadedApp()
    await user.type(getSearchBox(), 'zzzz')
    await user.clear(getSearchBox())
    expect(screen.queryByText(/no data found/i)).not.toBeInTheDocument()
    expect(within(getArticlesRegion()).getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('shows "No data found" when the API itself returns an empty list', async () => {
    renderApp({ articles: [] })
    expect(await screen.findByText(/no data found/i)).toBeVisible()
    expect(queryLoadingIndicator()).toBeNull()
  })
})
