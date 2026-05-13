import { useCallback, useState } from 'react'

function readLocalStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return initial
    return JSON.parse(raw) as T
  } catch {
    return initial
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() =>
    readLocalStorage(key, initialValue),
  )

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next =
          typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* ignore quota / private mode */
        }
        return next
      })
    },
    [key],
  )

  return [state, set] as const
}
