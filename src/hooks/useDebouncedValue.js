import { useEffect, useState } from 'react'

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`.
 * Every change restarts the wait, so a burst of keystrokes yields ONE update.
 * A delay of 0 (or less) disables debouncing and passes the value straight through.
 */
export function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (delayMs <= 0) return undefined
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return delayMs <= 0 ? value : debounced
}
