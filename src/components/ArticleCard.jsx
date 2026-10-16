import { memo } from 'react'
import './ArticleCard.css'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })

function ArticleCard({ article, isBookmarked, onToggleBookmark }) {
  return (
    <li className="article-card">
      <p className="article-card__category">{article.category}</p>
      <h2 className="article-card__title">{article.title}</h2>
      <p className="article-card__summary">{article.summary}</p>
      <div className="article-card__footer">
        <time className="article-card__date" dateTime={article.publishedAt}>
          {formatDate(article.publishedAt)}
        </time>
        {/* The accessible name never changes; state is exposed via aria-pressed. */}
        <button
          type="button"
          className="bookmark-button"
          aria-label={`Bookmark ${article.title}`}
          aria-pressed={isBookmarked}
          onClick={() => onToggleBookmark(article.id)}
        >
          {isBookmarked && <span aria-hidden="true">✓ </span>}
          Bookmark
        </button>
      </div>
    </li>
  )
}

// Memoized: with stable props (same article object, stable handler) a card does not
// re-render when the list around it changes.
export default memo(ArticleCard)
