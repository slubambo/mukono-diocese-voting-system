import { useCallback, useEffect, useState } from 'react'
import { peopleApi } from '../../api/people.api'
import type { PersonResponse } from '../../types/leadership'

export const usePersonSearch = () => {
  const [options, setOptions] = useState<PersonResponse[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string, opts?: { fetchAll?: boolean }) => {
    const trimmed = query?.trim() || ''
    const allowBlank = opts?.fetchAll
    if (!allowBlank && (!trimmed || trimmed.length < 2)) {
      setOptions([])
      return
    }
    setLoading(true)
    try {
      const res = await peopleApi.list({ q: trimmed || undefined, page: 0, size: 10, sort: 'fullName,asc' } as any)
      const content = (res as any)?.content ?? res ?? []
      setOptions(Array.isArray(content) ? content : [])
    } catch (err) {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    search('', { fetchAll: true }).catch(() => setOptions([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { options, loading, search }
}

export default usePersonSearch
