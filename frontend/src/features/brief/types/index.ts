import type { Ticket } from '../../tickets/types'

export type BriefStatus = 'pending_answers' | 'generating' | 'completed'

export type BriefUploadResponse = {
  briefId: string
  clarifyingQuestions: string[]
}

export type AnswerSubmitRequest = {
  answers: string[]
}

export type BriefDetail = {
  id: string
  originalText: string
  fileNames: string[]
  clarifyingQuestions: string[]
  userAnswers: string[]
  status: BriefStatus
  createdAt: string
  tickets: Ticket[]
}

export type HistoryItem = {
  _id: string
  fileNames: string[]
  createdAt: string
  status: BriefStatus
  tickets: Ticket[]
}
