import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TextareaAutoGrow } from '../components/ui/TextareaAutoGrow'
import { StepIndicator } from '../components/ui/StepIndicator'
import { ticketsPath } from '../config/routes'
import { useGetBriefById } from '../features/brief/hooks/useHistory'
import { useSubmitAnswers } from '../features/brief/hooks/useSubmitAnswers'

type ClarificationState = {
  questions?: string[]
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div
        className="h-12 w-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"
        aria-hidden
      />
      <p className="text-slate-300 text-center max-w-md">{label}</p>
    </div>
  )
}

type ClarificationRespondFormProps = {
  questions: string[]
  briefId: string
}

function ClarificationRespondForm({
  questions,
  briefId,
}: ClarificationRespondFormProps) {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState(() => questions.map(() => ''))
  const submit = useSubmitAnswers(briefId)

  const answeredCount = questions.filter(
    (_, i) => (answers[i] ?? '').trim().length > 0,
  ).length
  const remaining = Math.max(0, questions.length - answeredCount)

  const allAnswered =
    questions.length === 0 ||
    (answers.length === questions.length &&
      answers.every((a) => a.trim().length > 0))

  const onSubmit = () => {
    if (!allAnswered) return
    submit.mutate(
      { answers: questions.length === 0 ? [] : answers },
      {
        onSuccess: (data) => {
          toast.success('Tickets generated successfully!')
          navigate(ticketsPath(briefId), {
            state: { tickets: data.tickets },
          })
        },
      },
    )
  }

  const submitError =
    submit.isError && submit.error instanceof Error
      ? submit.error.message
      : submit.isError
        ? 'Submission failed.'
        : null

  return (
    <>
      {submit.isPending ? (
        <Spinner label="Generating your dev tickets..." />
      ) : (
        <>
          {questions.length > 0 ? (
            <p className="text-sm text-slate-400">
              {answeredCount} of {questions.length} question
              {questions.length === 1 ? '' : 's'} answered
            </p>
          ) : (
            <p className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
              No clarifying questions were raised — you can generate tickets
              immediately.
            </p>
          )}
          <ol className="space-y-8">
            {questions.map((question, index) => (
              <li
                key={`${index}-${question.slice(0, 48)}`}
                className="rounded-r-xl border-l-4 border-cyan-500/70 bg-slate-900/30 pl-5 pr-3 py-4"
              >
                <label
                  htmlFor={`answer-${briefId}-${index}`}
                  className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-200"
                >
                  <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-200 ring-1 ring-cyan-500/40">
                    Q{index + 1}
                  </span>
                  <span>{question}</span>
                </label>
                <TextareaAutoGrow
                  id={`answer-${briefId}-${index}`}
                  minRows={3}
                  placeholder="Type your answer here..."
                  value={answers[index] ?? ''}
                  onChange={(e) => {
                    const next = [...answers]
                    next[index] = e.target.value
                    setAnswers(next)
                  }}
                  className="mt-3"
                />
                <p className="mt-1 text-xs text-slate-500 text-right">
                  {(answers[index] ?? '').length} characters
                </p>
              </li>
            ))}
          </ol>

          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
            >
              {submitError}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 pt-2 md:items-start">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!allAnswered || submit.isPending}
              className="inline-flex w-full max-w-md justify-center rounded-lg bg-cyan-500 px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
            >
              {allAnswered
                ? 'Generate Tickets →'
                : `Please answer ${remaining} more question${remaining === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      )}
    </>
  )
}

export function ClarificationPage() {
  const { briefId } = useParams<{ briefId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ClarificationState | undefined

  const {
    data: brief,
    isLoading,
    isError,
    error,
  } = useGetBriefById(briefId)

  const questions = useMemo(() => {
    if (state?.questions && state.questions.length > 0) {
      return state.questions
    }
    return brief?.clarifyingQuestions ?? []
  }, [state?.questions, brief?.clarifyingQuestions])

  const questionsKey = useMemo(() => JSON.stringify(questions), [questions])

  const loadError =
    isError && error instanceof Error
      ? error.message
      : isError
        ? 'Could not load this brief.'
        : null

  if (!briefId) {
    return <p className="text-center text-red-300">Invalid brief link.</p>
  }

  if (brief?.status === 'generating') {
    return <Spinner label="Generating your dev tickets..." />
  }

  if (isLoading && questions.length === 0) {
    return <Spinner label="Loading brief..." />
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="max-w-xl mx-auto rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
      >
        {loadError}
      </div>
    )
  }

  if (questions.length === 0 && brief?.status === 'completed') {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4">
        <p className="text-slate-300">
          This brief has no clarifying questions and is already completed.
        </p>
        <button
          type="button"
          onClick={() => navigate(ticketsPath(briefId))}
          className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          View tickets
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <StepIndicator activeStep={2} />
      <header className="space-y-2 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Before we generate tickets, we need a few clarifications
        </h1>
        <p className="text-slate-400">
          Please answer all questions below so we can generate accurate tickets.
        </p>
      </header>

      <ClarificationRespondForm
        key={questionsKey}
        questions={questions}
        briefId={briefId}
      />
    </div>
  )
}
