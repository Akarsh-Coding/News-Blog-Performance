import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const setup = (delay = 300) =>
  renderHook(({ value, delayMs }) => useDebouncedValue(value, delayMs), { initialProps: { value: 'a', delayMs: delay } })

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', () => {
    expect(setup().result.current).toBe('a')
  })

  it('keeps the old value until the delay has fully passed', () => {
    const { result, rerender } = setup()
    rerender({ value: 'b', delayMs: 300 })

    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('b')
  })

  it('every change restarts the wait, so a burst collapses into the last value', () => {
    const { result, rerender } = setup()
    rerender({ value: 'b', delayMs: 300 })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'c', delayMs: 300 })
    act(() => vi.advanceTimersByTime(200)) // 400 ms since "b", but only 200 since "c"
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('c') // "b" was never published
  })

  it('with a delay of 0 passes the value straight through, with no timer', () => {
    const { result, rerender } = setup(0)
    rerender({ value: 'b', delayMs: 0 })
    expect(result.current).toBe('b')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('leaves no timer running after unmount', () => {
    const { rerender, unmount } = setup()
    rerender({ value: 'b', delayMs: 300 })
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
