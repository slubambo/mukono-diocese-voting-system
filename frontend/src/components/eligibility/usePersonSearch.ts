import { useCallback, useState } from 'react'
import { peopleApi } from '../../api/people.api'
import type { PersonResponse } from '../../types/leadership'

export const usePersonSearch = () => {
  const [options, setOptions] = useState<PersonResponse[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setOptions([])
      return
    }
    setLoading(true)
    try {
      const res = await peopleApi.list({ q: query, page: 0, size: 10, sort: 'fullName,asc' } as any)
      const content = (res as any)?.content ?? res ?? []
      setOptions(Array.isArray(content) ? content : [])
    } catch (err) {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { options, loading, search }
}

export default usePersonSearch
