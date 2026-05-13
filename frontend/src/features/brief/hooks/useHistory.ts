import { useQuery } from '@tanstack/react-query'
import { getBriefById, getHistory } from '../api/brief.api'
import { briefQueryKeys } from '../api/queryKeys'

export function useGetHistory() {
  return useQuery({
    queryKey: briefQueryKeys.history(),
    queryFn: getHistory,
  })
}

export function useGetBriefById(briefId: string | undefined) {
  return useQuery({
    queryKey: briefQueryKeys.detail(briefId ?? ''),
    queryFn: () => getBriefById(briefId!),
    enabled: Boolean(briefId?.trim()),
  })
}
