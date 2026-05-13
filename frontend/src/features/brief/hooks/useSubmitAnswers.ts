import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitAnswers } from '../api/brief.api'
import { briefQueryKeys } from '../api/queryKeys'
import type { AnswerSubmitRequest } from '../types'

export function useSubmitAnswers(briefId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AnswerSubmitRequest) => {
      if (!briefId?.trim()) {
        return Promise.reject(new Error('Missing brief id.'))
      }
      return submitAnswers(briefId, body)
    },
    onSuccess: () => {
      if (briefId) {
        void queryClient.invalidateQueries({
          queryKey: briefQueryKeys.detail(briefId),
        })
        void queryClient.invalidateQueries({
          queryKey: briefQueryKeys.history(),
        })
      }
    },
  })
}
