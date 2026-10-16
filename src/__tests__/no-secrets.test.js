// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * Guards the Definition of Done: "No real API keys or sensitive PII are
 * hardcoded in the source." Scans every text file in the repo (not node_modules,
 * dist, .git or the lockfile).
 */
const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git'])
const SELF = 'no-secrets.test.js'

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

const isTextFile = (file) => /\.(?:jsx?|mjs|cjs|json|css|html|md|svg|txt|ya?ml)$/.test(file) || basename(file).startsWith('.env')

const files = [...walk(ROOT)]
  .filter((file) => isTextFile(file) && basename(file) !== 'package-lock.json' && basename(file) !== SELF)
  .map((file) => ({ path: relative(ROOT, file), text: readFileSync(file, 'utf8') }))

const findings = (pattern) => files.filter(({ text }) => pattern.test(text)).map(({ path }) => path)

const SECRET_PATTERNS = {
  'AWS access key': /\bAKIA[0-9A-Z]{16}\b/,
  'Google API key': /\bAIza[0-9A-Za-z_-]{35}\b/,
  'sk- style API key (OpenAI/Anthropic/Stripe)': /\bsk-[A-Za-z0-9_-]{20,}/,
  'GitHub token': /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  'Slack token': /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  'private key block': /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  'JWT': /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./,
  'hardcoded credential assignment': /\b(?:api[_-]?key|secret|passwd|password|auth[_-]?token|access[_-]?token)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
}

const PII_PATTERNS = {
  'US social security number': /\b\d{3}-\d{2}-\d{4}\b/,
  'phone number': /(?<![\d.])(?:\+?\d{1,3}[\s.-])?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?![\d.])/,
  'Indian mobile number': /(?<![\d.])(?:\+?91[\s-]?)?[6-9]\d{9}(?![\d.])/,
  'Aadhaar-like number': /(?<!\d)\d{4}\s\d{4}\s\d{4}(?!\d)/,
}

const RESERVED_EMAIL_DOMAIN = /(?:^|\.)(?:example\.(?:com|org|net)|localhost|invalid|test)$/i

describe('No hardcoded secrets or PII', () => {
  it('actually scans the repository (guards against a vacuous pass)', () => {
    expect(files.length).toBeGreaterThan(30)
    expect(files.some(({ path }) => path.endsWith('App.jsx'))).toBe(true)
  })

  it.each(Object.entries(SECRET_PATTERNS))('no %s anywhere', (_name, pattern) => {
    expect(findings(pattern)).toEqual([])
  })

  it.each(Object.entries(PII_PATTERNS))('no %s anywhere', (_name, pattern) => {
    expect(findings(pattern)).toEqual([])
  })

  it('every email address is on a reserved example domain (no real people)', () => {
    const real = []
    for (const { path, text } of files) {
      for (const [, domain] of text.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g)) {
        if (!RESERVED_EMAIL_DOMAIN.test(domain)) real.push(`${path}: ${domain}`)
      }
    }
    expect(real).toEqual([])
  })

  it('client code only reads non-secret environment flags (VITE_* is public, bundled into the app)', () => {
    const names = new Set()
    for (const { path, text } of files) {
      if (!path.startsWith('src') || path.includes('__tests__')) continue
      for (const [, name] of text.matchAll(/import\.meta\.env\.([A-Z0-9_]+)/g)) names.add(name)
    }
    expect(names.size).toBeGreaterThan(0)
    for (const name of names) expect(name, `${name} looks like a secret`).not.toMatch(/KEY|SECRET|TOKEN|PASS|PRIVATE/i)
  })

  it('.env files are git-ignored (only .env.example is committed)', () => {
    const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8')
    expect(gitignore).toMatch(/^\.env$/m)
    expect(gitignore).toMatch(/^\.env\.\*$/m)
    expect(gitignore).toMatch(/^!\.env\.example$/m)
  })

  it('source code never bypasses React escaping (no dangerouslySetInnerHTML / innerHTML / eval)', () => {
    // Comments are ignored (they may legitimately *mention* these APIs); ESLint also bans real uses.
    const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
    const offenders = files
      .filter(({ path }) => path.startsWith('src') && !path.includes('__tests__'))
      .filter(({ text }) => /dangerouslySetInnerHTML|\.innerHTML|\.outerHTML|insertAdjacentHTML|\beval\s*\(|new Function\s*\(/.test(withoutComments(text)))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })
})
