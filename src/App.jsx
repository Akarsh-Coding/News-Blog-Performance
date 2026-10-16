import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadArticles } from './api/newsApi'
import ArticleCard from './components/ArticleCard'
import ArticleControls from './components/ArticleControls'
import StoryForm from './components/StoryForm'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { trackInteraction } from './utils/analytics'
import { filterAndSortArticles } from './utils/filterArticles'
import { sanitizeText } from './utils/sanitizeText'
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

  // Telemetry: a search "completes" when the debounced query is applied, so a
  // burst of keystrokes is ONE event. (Skips the initial value.)
  const lastTrackedQuery = useRef(query)
  useEffect(() => {
    if (lastTrackedQuery.current === query) return
    lastTrackedQuery.current = query
    trackInteraction()
  }, [query])

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
  const handleSearchChange = useCallback((event) => setSearchText(sanitizeText(event.target.value)), [])
  const handleCategoryChange = useCallback((event) => {
    setCategory(event.target.value)
    trackInteraction()
  }, [])
  const handleSortChange = useCallback((event) => {
    setSortBy(event.target.value)
    trackInteraction()
  }, [])
  const toggleBookmark = useCallback((id) => {
    trackInteraction()
    setBookmarkedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <>
      <a className="skip-link" href="#story-title">
        Skip to the Submit a story form
      </a>
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

            <section aria-label="Articles">
              {/*
                One PERSISTENT polite live region. It exists before any message does, so
                screen readers announce loading, result counts and "No data found" when
                they appear. (No aria-busy on an ancestor: that would silence it.)
              */}
              <div role="status" aria-live="polite" aria-atomic="true">
                {status === 'loading' && <p className="status">Loading articles…</p>}

                {status === 'success' && (
                  <p className="results-count">
                    Showing {visibleArticles.length} of {articles.length} articles
                  </p>
                )}

                {status === 'success' && visibleArticles.length === 0 && (
                  <div className="empty-state">
                    <p className="empty-state__title">No data found</p>
                    <p className="empty-state__hint">
                      {articles.length === 0
                        ? 'There are no articles to show right now.'
                        : 'Try a different search term or choose another category.'}
                    </p>
                  </div>
                )}
              </div>

              {status === 'error' && (
                <div role="alert" className="status status--error">
                  <p>We couldn’t load the articles. Check your connection and try again.</p>
                  <button type="button" className="button" aria-label="Retry loading articles" onClick={retry}>
                    Retry
                  </button>
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
    </>
  )
}
