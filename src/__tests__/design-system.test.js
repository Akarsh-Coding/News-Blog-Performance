import { describe, expect, it } from 'vitest'

// Every stylesheet and component under src/ except tests and the tokens file itself.
const raw = import.meta.glob(['../**/*.css', '../**/*.jsx'], { query: '?raw', import: 'default', eager: true })
const sources = Object.entries(raw).filter(
  ([path]) => !path.includes('__tests__') && !path.includes('/test/') && !path.endsWith('tokens.css'),
)
const cssSources = sources.filter(([path]) => path.endsWith('.css'))

const declarations = (css, property) => [...css.matchAll(new RegExp(`^\\s*(${property})\\s*:\\s*([^;]+);`, 'gm'))]

const tokensCss = Object.entries(import.meta.glob('../styles/tokens.css', { query: '?raw', import: 'default', eager: true }))[0][1]

describe('Design system (ticket: no rogue colors, consistent 16px/32px spacing)', () => {
  it('palette is grayscale, except for the red status family used for errors', () => {
    const colors = [...tokensCss.matchAll(/--([a-z0-9-]+):\s*#([0-9a-fA-F]{6})\b/g)]
    expect(colors.length).toBeGreaterThanOrEqual(7)
    for (const [, name, hex] of colors) {
      const [r, g, b] = [0, 2, 4].map((i) => hex.slice(i, i + 2))
      const isGray = r === g && g === b
      expect(isGray || name.startsWith('red-'), `--${name}: #${hex} must be gray (or part of the red-* error family)`).toBe(true)
    }
  })

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

  it.each(cssSources)('%s never removes the focus outline (visible focus is required)', (_path, css) => {
    expect(css).not.toMatch(/outline\s*:\s*(?:none|0)\b/)
  })

  it('defines a global :focus-visible style for every interactive element', () => {
    const base = sources.find(([path]) => path.endsWith('index.css'))[1]
    expect(base).toMatch(/:focus-visible\s*\{[^}]*outline:\s*var\(--focus-width\)/)
  })

  it.each(cssSources)('%s takes every font-size from the type scale', (_path, css) => {
    for (const [, , value] of declarations(css, 'font-size')) {
      expect(value.trim()).toMatch(/^var\(--font-size-\d+\)$/)
    }
  })
})
