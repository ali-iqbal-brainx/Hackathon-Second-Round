import { useState } from 'react'
import { generatePDF } from '../../../shared/utils/generatePDF'
import type { HistoryItem } from '../types'
import { TicketCard } from '../../tickets/components/TicketCard'

function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

function StatusBadge({ status }: { status: HistoryItem['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/40">
        Completed
      </span>
    )
  }
  if (status === 'pending_answers') {
    return (
      <span className="inline-flex rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-100 ring-1 ring-amber-400/40">
        Awaiting Answers
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-100 ring-1 ring-sky-400/40">
      Generating
    </span>
  )
}

type BriefHistoryCardProps = {
  item: HistoryItem
  expanded: boolean
  onToggle: () => void
}

export function BriefHistoryCard({
  item,
  expanded,
  onToggle,
}: BriefHistoryCardProps) {
  const [pdfBusy, setPdfBusy] = useState(false)
  const ticketCount = item.tickets.length
  const briefTitle =
    item.fileNames.length > 0 ? item.fileNames.join(', ') : 'Untitled brief'

  const onDownloadPdf = () => {
    if (item.tickets.length === 0) return
    setPdfBusy(true)
    queueMicrotask(() => {
      try {
        generatePDF(item.tickets, briefTitle)
      } finally {
        setPdfBusy(false)
      }
    })
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="text-xs text-slate-500">
              {formatCreatedAt(item.createdAt)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.fileNames.length === 0 ? (
              <span className="text-sm text-slate-500">No files recorded</span>
            ) : (
              item.fileNames.map((name) => (
                <span
                  key={name}
                  className="inline-block max-w-[220px] truncate rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300"
                >
                  {name}
                </span>
              ))
            )}
          </div>
          <p className="text-sm text-slate-400">
            {ticketCount === 0
              ? 'No tickets yet'
              : `${ticketCount} ticket${ticketCount === 1 ? '' : 's'} generated`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
          >
            {expanded ? 'Hide tickets' : 'View tickets'}
          </button>
          <button
            type="button"
            disabled={ticketCount === 0 || pdfBusy}
            onClick={onDownloadPdf}
            className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 transition inline-flex items-center justify-center gap-2"
          >
            {pdfBusy ? (
              <>
                <span
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  aria-hidden
                />
                Preparing…
              </>
            ) : (
              'Download PDF'
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 px-5 pb-5 pt-4">
          {ticketCount === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">
              No tickets for this brief yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {item.tickets.map((ticket, index) => (
                <TicketCard key={ticket.id} ticket={ticket} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
