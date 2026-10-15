import { describe, expect, it } from 'vitest'
import { filterAndSortArticles } from '../utils/filterArticles'
import { ARTICLES, TITLES_A_TO_Z, TITLES_NEWEST_FIRST, TITLES_OLDEST_FIRST } from '../test/fixtures'

const titles = (list) => list.map((a) => a.title)

describe('filterAndSortArticles (unit contract)', () => {
  it('defaults to every article, newest first', () => {
    expect(titles(filterAndSortArticles(ARTICLES))).toEqual(TITLES_NEWEST_FIRST)
    expect(titles(filterAndSortArticles(ARTICLES, {}))).toEqual(TITLES_NEWEST_FIRST)
  })

  it('matches the query against title or summary, case-insensitively, ignoring surrounding spaces', () => {
    expect(titles(filterAndSortArticles(ARTICLES, { query: '  CHIP ' }))).toEqual(['New chip doubles battery life'])
    expect(titles(filterAndSortArticles(ARTICLES, { query: 'recounts' }))).toEqual(['Election results delayed'])
  })

  it('filters by category, with "all" meaning no filter', () => {
    expect(titles(filterAndSortArticles(ARTICLES, { category: 'Sports' }))).toEqual(['Local team wins championship', 'Marathon record broken'])
    expect(filterAndSortArticles(ARTICLES, { category: 'all' })).toHaveLength(ARTICLES.length)
  })

  it('supports oldest and title sorting', () => {
    expect(titles(filterAndSortArticles(ARTICLES, { sortBy: 'oldest' }))).toEqual(TITLES_OLDEST_FIRST)
    expect(titles(filterAndSortArticles(ARTICLES, { sortBy: 'title' }))).toEqual(TITLES_A_TO_Z)
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterAndSortArticles(ARTICLES, { query: 'zzzz' })).toEqual([])
  })

  it('does not mutate its input (required for memoization to be safe)', () => {
    const input = Object.freeze([...ARTICLES].map((a) => Object.freeze({ ...a })))
    expect(() => filterAndSortArticles(input, { sortBy: 'title' })).not.toThrow()
    expect(input.map((a) => a.id)).toEqual(ARTICLES.map((a) => a.id))
  })
})
