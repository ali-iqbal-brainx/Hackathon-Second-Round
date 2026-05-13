import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { StepIndicator } from '../components/ui/StepIndicator'
import { ROUTES } from '../config/routes'
import { useGetBriefById } from '../features/brief/hooks/useHistory'
import { TicketCard } from '../features/tickets/components/TicketCard'
import { generatePDF } from '../shared/utils/generatePDF'
import type { Ticket } from '../features/tickets/types'

type TicketsLocationState = {
  tickets?: Ticket[]
}

const TYPE_OPTIONS = ['All', 'Frontend', 'Backend', 'Design'] as const
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'] as const

type TypeFilter = (typeof TYPE_OPTIONS)[number]
type PriorityFilter = (typeof PRIORITY_OPTIONS)[number]

export function TicketsPage() {
  const { briefId } = useParams<{ briefId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as TicketsLocationState | undefined

  const { data: brief, isLoading, isError, error } = useGetBriefById(briefId)

  const sourceTickets = useMemo(() => {
    if (state?.tickets && state.tickets.length > 0) {
      return state.tickets
    }
    return brief?.tickets ?? []
  }, [state?.tickets, brief?.tickets])

  const briefTitle =
    brief?.fileNames?.length && brief.fileNames.length > 0
      ? brief.fileNames.join(', ')
      : 'Developer tickets'

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>('All')
  const [pdfBusy, setPdfBusy] = useState(false)

  const filteredTickets = useMemo(() => {
    return sourceTickets.filter((t) => {
      const typeOk =
        typeFilter === 'All' ? true : t.type === typeFilter
      const priOk =
        priorityFilter === 'All' ? true : t.priority === priorityFilter
      return typeOk && priOk
    })
  }, [sourceTickets, typeFilter, priorityFilter])

  const summary = useMemo(() => {
    return {
      total: sourceTickets.length,
      frontend: sourceTickets.filter((t) => t.type === 'Frontend').length,
      backend: sourceTickets.filter((t) => t.type === 'Backend').length,
      design: sourceTickets.filter((t) => t.type === 'Design').length,
      high: sourceTickets.filter((t) => t.priority === 'High').length,
    }
  }, [sourceTickets])

  const loadError =
    isError && error instanceof Error
      ? error.message
      : isError
        ? 'Could not load tickets.'
        : null

  const onDownloadPdf = () => {
    if (sourceTickets.length === 0) return
    setPdfBusy(true)
    queueMicrotask(() => {
      try {
        generatePDF(sourceTickets, briefTitle)
      } finally {
        setPdfBusy(false)
      }
    })
  }

  if (!briefId) {
    return <p className="text-center text-red-300">Invalid brief link.</p>
  }

  if (isLoading && sourceTickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div
          className="h-12 w-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"
          aria-hidden
        />
        <p className="text-slate-400">Loading tickets...</p>
      </div>
    )
  }

  if (loadError && sourceTickets.length === 0) {
    return (
      <div
        role="alert"
        className="max-w-xl mx-auto rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
      >
        {loadError}
      </div>
    )
  }

  if (brief?.status === 'generating' && sourceTickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div
          className="h-12 w-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"
          aria-hidden
        />
        <p className="text-slate-300 text-center max-w-md">
          Tickets are still being generated. This page will fill in shortly —
          try refreshing in a moment.
        </p>
      </div>
    )
  }

  if (sourceTickets.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <p className="text-slate-400">
          No tickets found for this brief. Start a new brief or return home.
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-flex rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Start New Brief
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <StepIndicator activeStep={3} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <header className="space-y-2 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Your Developer Tickets are Ready
          </h1>
          <p className="text-slate-400">
            {sourceTickets.length} ticket
            {sourceTickets.length === 1 ? '' : 's'} generated
            {filteredTickets.length !== sourceTickets.length
              ? ` (${filteredTickets.length} shown with current filters)`
              : ''}
          </p>
        </header>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={sourceTickets.length === 0 || pdfBusy}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            {pdfBusy ? (
              <>
                <span
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  aria-hidden
                />
                Generating…
              </>
            ) : (
              'Download PDF'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="rounded-lg border-2 border-cyan-500/50 bg-transparent px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10 transition"
          >
            Start New Brief
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        <span>
          <strong className="text-white">{summary.total}</strong> total
        </span>
        <span className="text-slate-600">|</span>
        <span>
          Frontend: <strong className="text-white">{summary.frontend}</strong>
        </span>
        <span>
          Backend: <strong className="text-white">{summary.backend}</strong>
        </span>
        <span>
          Design: <strong className="text-white">{summary.design}</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span>
          High priority:{' '}
          <strong className="text-white">{summary.high}</strong>
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div
          className={
            typeFilter !== 'All'
              ? 'rounded-lg ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-slate-950'
              : 'rounded-lg'
          }
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-400 uppercase tracking-wide">
            Type
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="min-w-[140px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 normal-case focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className={
            priorityFilter !== 'All'
              ? 'rounded-lg ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-slate-950'
              : 'rounded-lg'
          }
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-400 uppercase tracking-wide">
            Priority
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as PriorityFilter)
              }
              className="min-w-[140px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 normal-case focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <p className="text-center text-slate-500 py-8">
          No tickets match these filters. Try widening your selection.
        </p>
      ) : (
        <div
          key={`${sourceTickets.length}-${typeFilter}-${priorityFilter}`}
          className="tickets-fade grid gap-6 sm:grid-cols-1 lg:grid-cols-2"
        >
          {filteredTickets.map((ticket) => {
            const globalIndex = sourceTickets.findIndex((t) => t.id === ticket.id)
            return (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={globalIndex >= 0 ? globalIndex : 0}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
