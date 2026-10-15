import { describe, expect, it } from 'vitest'
import { validateField, validateStory } from '../utils/validateStory'
import { VALID_STORY } from '../test/fixtures'

describe('validateStory (custom regex rules)', () => {
  it('accepts a fully valid story', () => {
    expect(validateStory(VALID_STORY)).toEqual({})
  })

  it('reports every missing field', () => {
    expect(Object.keys(validateStory({ title: '', email: '', summary: '' }))).toEqual(['title', 'email', 'summary'])
  })

  it.each(['priya@example.com', 'first.last+news@sub.example.co.uk', 'a_b-c@mail-server.org'])('accepts email %s', (email) => {
    expect(validateField('email', email)).toBe('')
  })

  it.each(['plain', '@example.com', 'priya@', 'priya@example', 'priya@example.c', 'pri ya@example.com', 'priya@@example.com', 'priya@exam ple.com'])(
    'rejects email "%s"',
    (email) => {
      expect(validateField('email', email)).toMatch(/valid email/i)
    },
  )

  it('trims surrounding whitespace before checking', () => {
    expect(validateField('email', '  priya@example.com  ')).toBe('')
    expect(validateField('title', '   ')).toMatch(/required/i)
  })

  it('enforces title length 5-100', () => {
    expect(validateField('title', 'abcd')).toMatch(/5 to 100/)
    expect(validateField('title', 'abcde')).toBe('')
    expect(validateField('title', 'x'.repeat(100))).toBe('')
    expect(validateField('title', 'x'.repeat(101))).toMatch(/5 to 100/)
  })

  it('enforces summary length 20-500, allowing line breaks', () => {
    expect(validateField('summary', 'x'.repeat(19))).toMatch(/20 to 500/)
    expect(validateField('summary', `${'x'.repeat(10)}\n${'y'.repeat(10)}`)).toBe('')
    expect(validateField('summary', 'x'.repeat(501))).toMatch(/20 to 500/)
  })
})
