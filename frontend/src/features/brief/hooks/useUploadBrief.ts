import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadBrief } from '../api/brief.api'
import { briefQueryKeys } from '../api/queryKeys'

export function useUploadBrief() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => uploadBrief(files),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: briefQueryKeys.history(),
      })
    },
  })
}
