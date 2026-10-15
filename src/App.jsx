import { useEffect, useState } from 'react'
import { loadArticles } from './api/newsApi'
import ArticleCard from './components/ArticleCard'
import StoryForm from './components/StoryForm'
import { filterAndSortArticles } from './utils/filterArticles'
import './App.css'

export default function App() {
  const [articles, setArticles] = useState([])
  const [status, setStatus] = useState('loading') // loading | success | error
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set())

  useEffect(() => {
    let cancelled = false
    loadArticles({ attempt })
      .then((data) => {
        if (cancelled) return
        setArticles(data)
        setStatus('success')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  function retry() {
    setStatus('loading')
    setAttempt((count) => count + 1)
  }

  const categories = [...new Set(articles.map((article) => article.category))].sort()
  const visibleArticles = filterAndSortArticles(articles, { query, category, sortBy })

  function toggleBookmark(id) {
    setBookmarkedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">News Explorer</h1>
        <p className="app__subtitle">Search, filter and bookmark the day&rsquo;s stories.</p>
      </header>

      <div className="layout">
        <div className="layout__main">
          <div className="controls">
            <div className="field field--grow">
              <label className="field__label" htmlFor="search">
                Search articles
              </label>
              <input
                id="search"
                type="search"
                className="field__control"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="field__control"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="sort">
                Sort by
              </label>
              <select id="sort" className="field__control" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title (A–Z)</option>
              </select>
            </div>
          </div>

          {status === 'success' && (
            <p className="results-count">
              Showing {visibleArticles.length} of {articles.length} articles
            </p>
          )}

          <section aria-label="Articles" aria-busy={status === 'loading'}>
            {status === 'loading' && (
              <p role="status" className="status">
                Loading articles…
              </p>
            )}

            {status === 'error' && (
              <div role="alert" className="status status--error">
                <p>We couldn’t load the articles. Check your connection and try again.</p>
                <button type="button" className="button" onClick={retry}>
                  Retry
                </button>
              </div>
            )}

            {status === 'success' && visibleArticles.length === 0 && (
              <div role="status" className="empty-state">
                <p className="empty-state__title">No data found</p>
                <p className="empty-state__hint">
                  {articles.length === 0
                    ? 'There are no articles to show right now.'
                    : 'Try a different search term or choose another category.'}
                </p>
              </div>
            )}

            {status === 'success' && visibleArticles.length > 0 && (
              <ul className="article-list">
                {visibleArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isBookmarked={bookmarkedIds.has(article.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="layout__side">
          <StoryForm />
        </div>
      </div>
    </main>
  )
}
