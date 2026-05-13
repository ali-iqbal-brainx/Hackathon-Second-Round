import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../config/routes'
import { BriefHistoryCard } from '../features/brief/components/BriefHistoryCard'
import { useGetHistory } from '../features/brief/hooks/useHistory'

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
        />
      ))}
    </div>
  )
}

export function HistoryPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetHistory()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const loadError =
    isError && error instanceof Error
      ? error.message
      : isError
        ? 'Could not load history.'
        : null

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="space-y-2 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Brief History
          </h1>
          <p className="text-slate-400">
            All previously processed client briefs and their generated tickets.
          </p>
        </header>
        <Link
          to={ROUTES.HOME}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
        >
          New Brief
        </Link>
      </div>

      {isLoading ? (
        <HistorySkeleton />
      ) : loadError ? (
        <div
          role="alert"
          className="mx-auto max-w-lg rounded-xl border border-red-500/40 bg-red-950/40 px-5 py-6 text-center"
        >
          <p className="text-red-100">{loadError}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-4 rounded-lg border border-red-400/50 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-900/50 disabled:opacity-50"
          >
            {isFetching ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      ) : !data?.length ? (
        <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 text-4xl text-slate-500"
            aria-hidden
          >
            📄
          </div>
          <h2 className="text-xl font-semibold text-white">No briefs yet</h2>
          <p className="mt-2 text-slate-400">
            Upload your first client brief to get started.
          </p>
          <Link
            to={ROUTES.HOME}
            className="mt-8 inline-flex rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
          >
            Upload Brief
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {data.map((item) => (
            <li key={item._id}>
              <BriefHistoryCard
                item={item}
                expanded={expandedId === item._id}
                onToggle={() => toggle(item._id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
