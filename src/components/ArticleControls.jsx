import { memo } from 'react'

/**
 * Search / category / sort controls. Memoized: it only re-renders when one of
 * its own props changes, NOT when e.g. a bookmark is toggled. That only works
 * because App passes it stable (useCallback / useMemo) props.
 */
function ArticleControls({ searchText, category, sortBy, categories, onSearchChange, onCategoryChange, onSortChange }) {
  return (
    <div className="controls" role="search" aria-label="Search and filter articles">
      <div className="field field--grow">
        <label className="field__label" htmlFor="search">
          Search articles
        </label>
        <input id="search" type="search" className="field__control" value={searchText} onChange={onSearchChange} />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="category">
          Category
        </label>
        <select id="category" className="field__control" value={category} onChange={onCategoryChange}>
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
        <select id="sort" className="field__control" value={sortBy} onChange={onSortChange}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </div>
    </div>
  )
}

export default memo(ArticleControls)
