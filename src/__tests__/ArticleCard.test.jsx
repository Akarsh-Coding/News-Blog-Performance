import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArticleCard from '../components/ArticleCard'
import { ARTICLES } from '../test/fixtures'

const article = ARTICLES[0]
const setup = (props = {}) => {
  const onToggleBookmark = vi.fn()
  render(
    <ul>
      <ArticleCard article={article} isBookmarked={false} onToggleBookmark={onToggleBookmark} {...props} />
    </ul>,
  )
  return { onToggleBookmark }
}

describe('<ArticleCard /> (unit contract)', () => {
  it('is wrapped in React.memo', () => {
    expect(ArticleCard.$$typeof).toBe(Symbol.for('react.memo'))
  })

  it('renders a list item with the title as a heading, plus summary and category', () => {
    setup()
    expect(screen.getByRole('listitem')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: article.title })).toBeInTheDocument()
    expect(screen.getByText(article.summary)).toBeInTheDocument()
    expect(screen.getByText(article.category)).toBeInTheDocument()
  })

  it.each([true, false])('reflects isBookmarked=%s in aria-pressed', (isBookmarked) => {
    setup({ isBookmarked })
    expect(screen.getByRole('button', { name: `Bookmark ${article.title}` })).toHaveAttribute('aria-pressed', String(isBookmarked))
  })

  it('calls onToggleBookmark with the article id when the bookmark is clicked', async () => {
    const { onToggleBookmark } = setup()
    await userEvent.click(screen.getByRole('button', { name: `Bookmark ${article.title}` }))
    expect(onToggleBookmark).toHaveBeenCalledTimes(1)
    expect(onToggleBookmark).toHaveBeenCalledWith(article.id)
  })
})
