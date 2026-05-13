import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clarificationPath } from '../config/routes'
import { FileUploadZone } from '../features/brief/components/FileUploadZone'
import { useUploadBrief } from '../features/brief/hooks/useUploadBrief'
import { StepIndicator } from '../components/ui/StepIndicator'

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div
        className="h-12 w-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"
        aria-hidden
      />
      <p className="text-slate-300 text-center max-w-md">{label}</p>
    </div>
  )
}

export function UploadPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const upload = useUploadBrief()

  const onAnalyze = () => {
    if (files.length === 0) return
    upload.mutate(files, {
      onSuccess: (data) => {
        navigate(clarificationPath(data.briefId), {
          state: { questions: data.clarifyingQuestions },
        })
      },
    })
  }

  const errorMessage =
    upload.isError && upload.error instanceof Error
      ? upload.error.message
      : upload.isError
        ? 'Upload failed. Please try again.'
        : null

  return (
    <div className="flex flex-col items-center gap-8 md:gap-10">
      <StepIndicator activeStep={1} />

      <header className="text-center max-w-2xl space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Brief to Tickets Converter
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Upload your client briefs — we extract the text, surface ambiguities,
          and turn answers into developer-ready Jira-style tickets.
        </p>
      </header>

      {upload.isPending ? (
        <Spinner label="Extracting & Analyzing your brief..." />
      ) : (
        <>
          <FileUploadZone
            files={files}
            onFilesChange={setFiles}
            disabled={upload.isPending}
          />

          {errorMessage && (
            <div
              role="alert"
              className="w-full max-w-2xl rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={onAnalyze}
            disabled={files.length === 0 || upload.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Analyze Brief
          </button>
        </>
      )}
    </div>
  )
}
