const SORTERS = {
  newest: (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  oldest: (a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt),
  title: (a, b) => a.title.localeCompare(b.title),
}

/**
 * Pure function: filters by search text and category, then sorts.
 * Never mutates `articles` (filter() returns a new array, so sorting it is safe).
 */
export function filterAndSortArticles(articles, { query = '', category = 'all', sortBy = 'newest' } = {}) {
  const needle = query.trim().toLowerCase()

  const matches = articles.filter((article) => {
    const inCategory = category === 'all' || article.category === category
    const inSearch =
      needle === '' ||
      article.title.toLowerCase().includes(needle) ||
      article.summary.toLowerCase().includes(needle)
    return inCategory && inSearch
  })

  return matches.sort(SORTERS[sortBy] ?? SORTERS.newest)
}
