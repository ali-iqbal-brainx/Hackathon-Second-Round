import { apiClient } from '../../../lib/axios'
import type {
  AnswerSubmitRequest,
  BriefDetail,
  BriefUploadResponse,
  HistoryItem,
} from '../types'
import type { Ticket, TicketsResponse } from '../../tickets/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseBriefUploadResponse(data: unknown): BriefUploadResponse {
  if (!isRecord(data)) {
    throw new Error('Invalid server response.')
  }
  const { briefId, clarifyingQuestions } = data
  if (typeof briefId !== 'string' || !briefId.trim()) {
    throw new Error('Invalid server response.')
  }
  if (!Array.isArray(clarifyingQuestions)) {
    throw new Error('Invalid server response.')
  }
  if (!clarifyingQuestions.every((q) => typeof q === 'string')) {
    throw new Error('Invalid server response.')
  }
  return {
    briefId,
    clarifyingQuestions: clarifyingQuestions.map((q) => q.trim()),
  }
}

function isTicketPriority(v: string): v is Ticket['priority'] {
  return v === 'High' || v === 'Medium' || v === 'Low'
}

function isTicketType(v: string): v is Ticket['type'] {
  return v === 'Frontend' || v === 'Backend' || v === 'Design'
}

function parseTicket(value: unknown, index: number): Ticket {
  if (!isRecord(value)) {
    throw new Error(`Invalid ticket at index ${index}.`)
  }
  const id = typeof value.id === 'string' ? value.id : undefined
  if (!id?.trim()) {
    throw new Error(`Invalid ticket at index ${index}: missing id.`)
  }
  const title = typeof value.title === 'string' ? value.title.trim() : ''
  const description =
    typeof value.description === 'string' ? value.description.trim() : ''
  if (!title || !description) {
    throw new Error(`Invalid ticket at index ${index}: title or description.`)
  }
  const ac = value.acceptanceCriteria
  if (!Array.isArray(ac) || !ac.every((c) => typeof c === 'string')) {
    throw new Error(`Invalid ticket at index ${index}: acceptanceCriteria.`)
  }
  const acceptanceCriteria = ac.map((s) => s.trim()).filter(Boolean)
  const priorityRaw = value.priority
  const typeRaw = value.type
  if (typeof priorityRaw !== 'string' || !isTicketPriority(priorityRaw)) {
    throw new Error(`Invalid ticket at index ${index}: priority.`)
  }
  if (typeof typeRaw !== 'string' || !isTicketType(typeRaw)) {
    throw new Error(`Invalid ticket at index ${index}: type.`)
  }
  const briefId =
    typeof value.briefId === 'string' && value.briefId.trim()
      ? value.briefId
      : undefined
  const createdAt =
    typeof value.createdAt === 'string' ? value.createdAt : undefined
  return {
    id: id.trim(),
    briefId,
    title,
    description,
    acceptanceCriteria,
    priority: priorityRaw,
    type: typeRaw,
    createdAt,
  }
}

function parseTicketsResponse(data: unknown): TicketsResponse {
  if (!isRecord(data)) {
    throw new Error('Invalid server response.')
  }
  const { tickets } = data
  if (!Array.isArray(tickets)) {
    throw new Error('Invalid server response.')
  }
  return {
    tickets: tickets.map((t, i) => parseTicket(t, i)),
  }
}

function isBriefStatus(v: string): v is BriefDetail['status'] {
  return v === 'pending_answers' || v === 'generating' || v === 'completed'
}

function parseBriefDetail(data: unknown): BriefDetail {
  if (!isRecord(data)) {
    throw new Error('Invalid server response.')
  }
  const id = typeof data.id === 'string' ? data.id : ''
  if (!id.trim()) throw new Error('Invalid server response.')
  const originalText =
    typeof data.originalText === 'string' ? data.originalText : ''
  const fileNames = Array.isArray(data.fileNames)
    ? data.fileNames.filter((f): f is string => typeof f === 'string')
    : []
  const clarifyingQuestions = Array.isArray(data.clarifyingQuestions)
    ? data.clarifyingQuestions.filter((q): q is string => typeof q === 'string')
    : []
  const userAnswers = Array.isArray(data.userAnswers)
    ? data.userAnswers.filter((a): a is string => typeof a === 'string')
    : []
  const statusRaw = data.status
  if (typeof statusRaw !== 'string' || !isBriefStatus(statusRaw)) {
    throw new Error('Invalid server response.')
  }
  const createdAt =
    typeof data.createdAt === 'string'
      ? data.createdAt
      : new Date().toISOString()
  const ticketsRaw = data.tickets
  const tickets: Ticket[] = Array.isArray(ticketsRaw)
    ? ticketsRaw.map((t, i) => parseTicket(t, i))
    : []
  return {
    id: id.trim(),
    originalText,
    fileNames,
    clarifyingQuestions,
    userAnswers,
    status: statusRaw,
    createdAt,
    tickets,
  }
}

function parseHistoryItem(row: unknown, index: number): HistoryItem {
  if (!isRecord(row)) {
    throw new Error(`Invalid history item at index ${index}.`)
  }
  const briefIdRaw = row.briefId ?? row._id
  const idStr =
    typeof briefIdRaw === 'string' && briefIdRaw.trim()
      ? briefIdRaw.trim()
      : ''
  if (!idStr) {
    throw new Error(`Invalid history item at index ${index}: missing id.`)
  }
  const fileNames = Array.isArray(row.fileNames)
    ? row.fileNames.filter((f): f is string => typeof f === 'string')
    : []
  const createdAtRaw = row.createdAt
  const createdAt =
    typeof createdAtRaw === 'string'
      ? createdAtRaw
      : new Date().toISOString()
  const statusRaw = row.status
  if (typeof statusRaw !== 'string' || !isBriefStatus(statusRaw)) {
    throw new Error(`Invalid history item at index ${index}: status.`)
  }
  const ticketsRaw = row.tickets
  const tickets: Ticket[] = Array.isArray(ticketsRaw)
    ? ticketsRaw.map((t, i) => parseTicket(t, i))
    : []
  return {
    _id: idStr,
    fileNames,
    createdAt,
    status: statusRaw,
    tickets,
  }
}

function parseHistoryResponse(data: unknown): HistoryItem[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid server response.')
  }
  return data.map((row, i) => parseHistoryItem(row, i))
}

export async function getHistory(): Promise<HistoryItem[]> {
  const { data } = await apiClient.get<unknown>('/brief/history')
  return parseHistoryResponse(data)
}

export async function uploadBrief(
  files: File[],
): Promise<BriefUploadResponse> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  const { data } = await apiClient.post<unknown>('/brief/upload', formData)
  return parseBriefUploadResponse(data)
}

export async function submitAnswers(
  briefId: string,
  body: AnswerSubmitRequest,
): Promise<TicketsResponse> {
  const { data } = await apiClient.post<unknown>(
    `/brief/${briefId}/answers`,
    body,
  )
  return parseTicketsResponse(data)
}

export async function getBriefById(briefId: string): Promise<BriefDetail> {
  const { data } = await apiClient.get<unknown>(`/brief/${briefId}`)
  return parseBriefDetail(data)
}
