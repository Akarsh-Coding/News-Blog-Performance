import { describe, expect, it } from 'vitest'

// Every stylesheet and component under src/ except tests and the tokens file itself.
const raw = import.meta.glob(['../**/*.css', '../**/*.jsx'], { query: '?raw', import: 'default', eager: true })
const sources = Object.entries(raw).filter(
  ([path]) => !path.includes('__tests__') && !path.includes('/test/') && !path.endsWith('tokens.css'),
)
const cssSources = sources.filter(([path]) => path.endsWith('.css'))

const declarations = (css, property) => [...css.matchAll(new RegExp(`^\\s*(${property})\\s*:\\s*([^;]+);`, 'gm'))]

describe('Design system (ticket: no rogue colors, consistent 16px/32px spacing)', () => {
  it('actually scans the component files (guards against a vacuous pass)', () => {
    expect(sources.length).toBeGreaterThanOrEqual(4)
  })

  it.each(sources)('%s has no hardcoded colors', (_path, content) => {
    expect(content).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(content).not.toMatch(/\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\s*\(/i)
  })

  it.each(cssSources)('%s uses only spacing tokens for padding, margin and gap', (_path, css) => {
    const spacing = declarations(css, '(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?')
    for (const [, property, value] of spacing) {
      for (const part of value.trim().split(/\s+/)) {
        expect(part, `${property}: ${value}`).toMatch(/^(?:0|auto|var\(--space-\d+\))$/)
      }
    }
  })

  it.each(cssSources)('%s takes every font-size from the type scale', (_path, css) => {
    for (const [, , value] of declarations(css, 'font-size')) {
      expect(value.trim()).toMatch(/^var\(--font-size-\d+\)$/)
    }
  })
})
