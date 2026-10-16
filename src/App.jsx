import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadArticles } from './api/newsApi'
import ArticleCard from './components/ArticleCard'
import ArticleControls from './components/ArticleControls'
import StoryForm from './components/StoryForm'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { filterAndSortArticles } from './utils/filterArticles'
import './App.css'

// A burst of keystrokes recomputes the list once, after typing pauses.
// Tests set this to 0 so their assertions can stay synchronous.
const SEARCH_DEBOUNCE_MS = Number(import.meta.env.VITE_SEARCH_DEBOUNCE_MS ?? 300)

export default function App() {
  const [articles, setArticles] = useState([])
  const [status, setStatus] = useState('loading') // loading | success | error
  const [attempt, setAttempt] = useState(0)
  const [searchText, setSearchText] = useState('') // what the input shows: updates instantly
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set())

  const query = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS) // what filtering uses: settles after a pause

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

  // Derived data: recomputed only when its real inputs change (not when a bookmark
  // is toggled or the story form is typed into).
  const categories = useMemo(() => [...new Set(articles.map((article) => article.category))].sort(), [articles])
  const visibleArticles = useMemo(
    () => filterAndSortArticles(articles, { query, category, sortBy }),
    [articles, query, category, sortBy],
  )

  // Stable handlers: same function identity on every render, so memoized children
  // receiving them are not forced to re-render. (Setters use the functional form
  // where needed, so no dependencies are required.)
  const handleSearchChange = useCallback((event) => setSearchText(event.target.value), [])
  const handleCategoryChange = useCallback((event) => setCategory(event.target.value), [])
  const handleSortChange = useCallback((event) => setSortBy(event.target.value), [])
  const toggleBookmark = useCallback((id) => {
    setBookmarkedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">News Explorer</h1>
        <p className="app__subtitle">Search, filter and bookmark the day&rsquo;s stories.</p>
      </header>

      <div className="layout">
        <div className="layout__main">
          <ArticleControls
            searchText={searchText}
            category={category}
            sortBy={sortBy}
            categories={categories}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onSortChange={handleSortChange}
          />

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
