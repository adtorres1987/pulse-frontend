import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'

interface UseFetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useFetch<T>(url: string) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    axiosInstance
      .get<T>(url)
      .then((res) => {
        if (!cancelled) setState({ data: res.data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled)
          setState({ data: null, loading: false, error: err.message ?? 'Error desconocido' })
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
