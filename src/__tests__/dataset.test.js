import { describe, expect, it } from 'vitest'
import articles from '../../public/articles.json'

describe('Mock dataset (public/articles.json)', () => {
  it('has at least 200 articles so performance work is meaningful', () => {
    expect(articles.length).toBeGreaterThanOrEqual(200)
  })

  it('gives every article the fields the UI relies on', () => {
    for (const article of articles) {
      for (const field of ['id', 'title', 'summary', 'category']) {
        expect(typeof article[field], `${article.id}.${field}`).toBe('string')
        expect(article[field].trim().length).toBeGreaterThan(0)
      }
      expect(Number.isNaN(Date.parse(article.publishedAt))).toBe(false)
    }
  })

  it('has unique ids and unique titles (bookmark buttons are named by title)', () => {
    expect(new Set(articles.map((a) => a.id)).size).toBe(articles.length)
    expect(new Set(articles.map((a) => a.title)).size).toBe(articles.length)
  })

  it('spans several categories so the filter is useful', () => {
    expect(new Set(articles.map((a) => a.category)).size).toBeGreaterThanOrEqual(4)
  })
})
