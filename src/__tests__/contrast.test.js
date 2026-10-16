import { describe, expect, it } from 'vitest'

/*
 * WCAG 2.x contrast, computed straight from the design tokens (jsdom cannot
 * compute colors, so axe/Lighthouse-style contrast has to be checked here).
 *   text pairs      >= 4.5:1  (SC 1.4.3, normal text)
 *   UI/graphic pairs >= 3:1   (SC 1.4.11, borders, focus ring)
 * Disabled controls are exempt from WCAG contrast rules.
 */
const tokensCss = Object.values(import.meta.glob('../styles/tokens.css', { query: '?raw', import: 'default', eager: true }))[0]

const tokens = Object.fromEntries([...tokensCss.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]))

function resolve(name) {
  const value = tokens[name]
  const reference = value.match(/^var\(--([a-z0-9-]+)\)$/)
  return reference ? resolve(reference[1]) : value
}

const channel = (byte) => {
  const c = byte / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
const contrast = (a, b) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}
const ratio = (foreground, background) => contrast(resolve(`color-${foreground}`), resolve(`color-${background}`))

const TEXT_PAIRS = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'surface-hover'], ['text', 'danger-bg'],
  ['text-muted', 'bg'], ['text-muted', 'surface'],
  ['danger', 'bg'], ['danger', 'surface'], ['danger', 'danger-bg'],
  ['inverse-text', 'inverse-bg'],
]

const UI_PAIRS = [
  ['border', 'bg'], ['border', 'surface'], // input / select borders
  ['focus', 'bg'], ['focus', 'surface'], // focus ring
  ['danger', 'bg'], ['danger', 'surface'], // error borders
  ['text', 'bg'], ['text', 'surface'], // bookmark button border
  ['inverse-bg', 'bg'], ['inverse-bg', 'surface'], // primary button shape
]

describe('Design-token contrast (WCAG AA)', () => {
  it('resolves every semantic color to a hex value', () => {
    for (const name of ['bg', 'surface', 'text', 'text-muted', 'border', 'focus', 'danger', 'danger-bg', 'inverse-bg', 'inverse-text']) {
      expect(resolve(`color-${name}`), name).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it.each(TEXT_PAIRS)('text: %s on %s is at least 4.5:1', (foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(UI_PAIRS)('UI component: %s against %s is at least 3:1', (foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(3)
  })

  it('body text has AAA headroom (7:1) on the page background', () => {
    expect(ratio('text', 'bg')).toBeGreaterThanOrEqual(7)
    expect(ratio('text-muted', 'bg')).toBeGreaterThanOrEqual(7)
  })
})
