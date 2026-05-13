export type TicketPriority = 'High' | 'Medium' | 'Low'

export type TicketType = 'Frontend' | 'Backend' | 'Design'

/**
 * Developer ticket — API returns `id` (hex string). Some specs refer to this as `_id`.
 */
export type Ticket = {
  id: string
  briefId?: string
  title: string
  description: string
  acceptanceCriteria: string[]
  priority: TicketPriority
  type: TicketType
  createdAt?: string
}

export type TicketsResponse = {
  tickets: Ticket[]
}
