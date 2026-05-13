import type { Ticket } from '../types'

const typeStyles: Record<
  Ticket['type'],
  { label: string; className: string }
> = {
  Frontend: {
    label: 'Frontend',
    className: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/40',
  },
  Backend: {
    label: 'Backend',
    className: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40',
  },
  Design: {
    label: 'Design',
    className: 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40',
  },
}

const priorityStyles: Record<
  Ticket['priority'],
  { label: string; className: string }
> = {
  High: {
    label: 'High',
    className: 'bg-red-500/20 text-red-200 ring-1 ring-red-400/40',
  },
  Medium: {
    label: 'Medium',
    className: 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40',
  },
  Low: {
    label: 'Low',
    className: 'bg-slate-500/40 text-slate-200 ring-1 ring-slate-500/50',
  },
}

type TicketCardProps = {
  ticket: Ticket
  index: number
}

export function TicketCard({ ticket, index }: TicketCardProps) {
  const ticketCode = `TICKET-${String(index + 1).padStart(3, '0')}`
  const typeStyle = typeStyles[ticket.type]
  const priorityStyle = priorityStyles[ticket.priority]

  return (
    <article className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/40 backdrop-blur-sm transition duration-200 hover:border-slate-600 hover:shadow-xl hover:shadow-cyan-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90">
          {ticketCode}
        </p>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyle.className}`}
          >
            {typeStyle.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyle.className}`}
          >
            {priorityStyle.label}
          </span>
        </div>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{ticket.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {ticket.description}
      </p>
      <div className="mt-4 border-t border-slate-700/80 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Acceptance criteria
        </p>
        {ticket.acceptanceCriteria.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No criteria listed.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {ticket.acceptanceCriteria.map((item, acIndex) => (
              <li
                key={`${ticket.id}-${acIndex}-${item.slice(0, 24)}`}
                className="flex gap-2 text-sm text-slate-200"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-500/80"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
