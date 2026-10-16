/*
 * sanitizeText — removes markup and script payloads from user-typed text
 * BEFORE it is stored in state.
 *
 * This is defense in depth, not the only line of defense: React already
 * escapes text when rendering, and this project never uses
 * dangerouslySetInnerHTML / innerHTML / eval (ESLint enforces that). The point
 * here is that markup never even gets stored or sent to a server.
 *
 * Strategy: REMOVE, don't escape. Escaping would show the user "&lt;script&gt;"
 * in their own input. Once no "<" or ">" survives, no element can be created
 * from the text, so event-handler payloads like onerror=... become inert text.
 *
 * Known trade-off: a literal "<" or ">" in ordinary prose ("5 > 3") is dropped.
 */

// Control characters except tab (\t), newline (\n) and carriage return (\r).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

const COMMENTS = /<!--[\s\S]*?(?:-->|$)/g

// Elements whose CONTENT is code, so remove the content too (not just the tags).
// An unclosed element swallows everything up to the end of the input.
const RAW_TEXT_ELEMENTS = /<\s*(script|style|iframe|object|embed|noscript|template)\b[^>]*>[\s\S]*?(?:<\s*\/\s*\1\s*>|$)/gi

// Any other opening/closing tag, including an unterminated one like "<img src=x onerror=...".
const TAGS = /<\/?[a-z!?][^>]*(?:>|$)/gi

const SCRIPT_SCHEMES = /(?:java|vb)script\s*:/gi
const ANGLE_BRACKETS = /[<>]/g

// Stripping one layer can expose another ("<scr<script>ipt>"), so repeat until stable.
const MAX_PASSES = 10

export function sanitizeText(input) {
  if (typeof input !== 'string') return ''

  let text = input.replace(CONTROL_CHARS, '')

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const before = text
    text = text
      .replace(COMMENTS, '')
      .replace(RAW_TEXT_ELEMENTS, '')
      .replace(TAGS, '')
      .replace(SCRIPT_SCHEMES, '')
      .replace(ANGLE_BRACKETS, '') // last resort: guarantees no markup character survives
    if (text === before) break
  }

  return text
}
