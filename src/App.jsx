import { useEffect, useState } from 'react'
import ArticleCard from './components/ArticleCard'
import { filterAndSortArticles } from './utils/filterArticles'
import './App.css'

const ARTICLES_URL = `${import.meta.env.BASE_URL}articles.json`

export default function App() {
  const [articles, setArticles] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set())

  // Loading, empty and error states are added in the next steps.
  useEffect(() => {
    let cancelled = false
    fetch(ARTICLES_URL)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setArticles(data)
      })
    return () => {
      cancelled = true
    }
  }, [])

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

      <p className="results-count">
        Showing {visibleArticles.length} of {articles.length} articles
      </p>

      <section aria-label="Articles">
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
      </section>
    </main>
  )
}
