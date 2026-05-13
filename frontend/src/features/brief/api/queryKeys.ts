export const briefQueryKeys = {
  all: ['brief'] as const,
  detail: (briefId: string) => [...briefQueryKeys.all, 'detail', briefId] as const,
  history: () => [...briefQueryKeys.all, 'history'] as const,
}
