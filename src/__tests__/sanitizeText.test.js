import { describe, expect, it } from 'vitest'
import { sanitizeText } from '../utils/sanitizeText'

const PAYLOADS = [
  ['script block', '<script>alert(1)</script>', ''],
  ['script block + real text', '<script>alert(1)</script>Bob', 'Bob'],
  ['unclosed script swallows the rest', 'hi <script>alert(1)', 'hi '],
  ['img onerror', '<img src=x onerror=alert(1)>', ''],
  ['unterminated tag', '<img src=x onerror=alert(1)', ''],
  ['svg onload', '<svg onload=alert(1)>', ''],
  ['javascript: scheme', 'javascript:alert(1)<b>', 'alert(1)'],
  ['mixed-case scheme', 'JaVaScRiPt:alert(1)', 'alert(1)'],
  ['anchor with javascript: href', '<a href="javascript:alert(1)">click</a>', 'click'],
  ['nested/obfuscated tag', '<scr<script>ipt>alert(1)</scr</script>ipt>', ''],
  ['style block', '<style>body{display:none}</style>Hi', 'Hi'],
  ['iframe', '<iframe src="https://evil.example"></iframe>ok', 'ok'],
  ['html comment', '<!-- hidden -->visible', 'visible'],
  ['formatting tags are removed, text kept', '<b>bold</b> and <i>italic</i>', 'bold and italic'],
  ['NUL and control characters', 'a\u0000b\u0007c', 'abc'],
]

describe('sanitizeText', () => {
  it.each(PAYLOADS)('%s', (_name, input, expected) => {
    expect(sanitizeText(input)).toBe(expected)
  })

  it.each(PAYLOADS)('never leaves a "<" or ">" behind: %s', (_name, input) => {
    expect(sanitizeText(input)).not.toMatch(/[<>]/)
  })

  it.each(PAYLOADS)('is idempotent (sanitizing twice changes nothing): %s', (_name, input) => {
    const once = sanitizeText(input)
    expect(sanitizeText(once)).toBe(once)
  })

  it.each([
    'climate bill',
    'Tom & Jerry',
    "It's 5 o'clock",
    'Ünïcödé 日本語 العربية 🎉',
    'line one\nline two\twith a tab',
    '  leading and trailing spaces  ',
    'priya@example.com',
    'Q&A: what\'s "next"?',
  ])('leaves ordinary text untouched: %j', (text) => {
    expect(sanitizeText(text)).toBe(text)
  })

  it('drops stray angle brackets in prose (documented trade-off)', () => {
    expect(sanitizeText('a < b > c')).toBe('a  b  c')
  })

  it('returns an empty string for non-string input', () => {
    for (const value of [null, undefined, 42, {}, []]) expect(sanitizeText(value)).toBe('')
  })

  it('stays fast on adversarial input (no catastrophic backtracking)', () => {
    const nasty = `${'<scr'.repeat(2000)}${'ipt>'.repeat(2000)}${'<'.repeat(5000)}`
    const start = performance.now()
    const result = sanitizeText(nasty)
    expect(performance.now() - start).toBeLessThan(500)
    expect(result).not.toMatch(/[<>]/)
  })
})
