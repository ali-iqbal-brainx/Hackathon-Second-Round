import { useCallback, useId, useState } from 'react'
import { formatBytes } from '../../../shared/utils/formatBytes'

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot).toLowerCase() : ''
}

function FileTypeIcon({ filename }: { filename: string }) {
  const ext = extensionOf(filename)
  const label =
    ext === '.pdf'
      ? 'PDF'
      : ext === '.doc' || ext === '.docx'
        ? 'DOC'
        : ext === '.md'
          ? 'MD'
          : ext === '.rtf'
            ? 'RTF'
            : 'TXT'
  const color =
    ext === '.pdf'
      ? 'bg-red-500/20 text-red-200 ring-red-400/30'
      : ext === '.doc' || ext === '.docx'
        ? 'bg-blue-500/20 text-blue-200 ring-blue-400/30'
        : ext === '.md'
          ? 'bg-slate-500/30 text-slate-200 ring-slate-400/30'
          : ext === '.rtf'
            ? 'bg-amber-500/15 text-amber-100 ring-amber-400/25'
            : 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/30'

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ring-1 ${color}`}
      aria-hidden
    >
      {label}
    </span>
  )
}

function UploadCloudIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V8" />
      <path d="M8 12l4-4 4 4" />
      <path d="M4 14.5A4 4 0 0 1 6.5 7 5.5 5.5 0 0 1 17.5 7 4 4 0 1 1 15 19H9a4 4 0 0 1-5-4.5z" />
    </svg>
  )
}

const ACCEPT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'] as const

function isAllowedFile(file: File): boolean {
  return (ACCEPT_EXTENSIONS as readonly string[]).includes(
    extensionOf(file.name),
  )
}

type FileUploadZoneProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}

export function FileUploadZone({
  files,
  onFilesChange,
  disabled,
}: FileUploadZoneProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  const mergeFiles = useCallback(
    (incoming: File[]) => {
      const allowed = incoming.filter(isAllowedFile)
      const map = new Map<string, File>()
      const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`
      for (const f of files) {
        map.set(key(f), f)
      }
      for (const f of allowed) {
        map.set(key(f), f)
      }
      onFilesChange([...map.values()])
    },
    [files, onFilesChange],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? [...e.target.files] : []
    mergeFiles(list)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const dropped = e.dataTransfer.files ? [...e.dataTransfer.files] : []
    mergeFiles(dropped)
  }

  const removeAt = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false)
          }
        }}
        onDrop={onDrop}
        className={[
          'group flex flex-col items-center justify-center min-h-[240px] rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all duration-300 ease-out',
          disabled
            ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900/40'
            : isDragging
              ? 'scale-[1.02] border-cyan-400 bg-cyan-500/15 shadow-[0_0_0_4px_rgba(34,211,238,0.12)]'
              : 'border-slate-600 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70',
        ].join(' ')}
      >
        <input
          id={inputId}
          type="file"
          multiple
          disabled={disabled}
          accept={ACCEPT_EXTENSIONS.join(',')}
          className="sr-only"
          onChange={onInputChange}
        />
        <UploadCloudIcon
          className={
            isDragging && !disabled
              ? 'text-cyan-300 mb-4 transition-colors'
              : 'text-slate-500 mb-4 transition-colors group-hover:text-slate-400'
          }
        />
        <p className="text-lg font-medium text-slate-100 text-center">
          Drag & drop files here, or{' '}
          <span className="text-cyan-400 font-semibold">browse</span>
        </p>
        <p className="mt-2 text-sm text-slate-400 text-center">
          Accepted: PDF, DOC, DOCX, TXT, MD, RTF
        </p>
      </label>

      {files.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="inline-flex w-full sm:w-auto max-w-full items-center gap-3 rounded-xl border border-slate-600 bg-slate-800/90 px-3 py-2 text-sm text-slate-200 shadow-sm"
            >
              <FileTypeIcon filename={file.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeAt(index)
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-40"
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
