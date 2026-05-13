import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type TextareaHTMLAttributes,
} from 'react'

type TextareaAutoGrowProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number
}

export function TextareaAutoGrow({
  minRows = 3,
  className = '',
  onChange,
  value,
  ...rest
}: TextareaAutoGrowProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    const styles = window.getComputedStyle(el)
    const lineHeight = parseFloat(styles.lineHeight) || 20
    const minHeight = lineHeight * minRows
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`
  }, [minRows])

  useLayoutEffect(() => {
    resize()
  }, [value, resize])

  const id = useId()

  return (
    <textarea
      {...rest}
      id={rest.id ?? id}
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => {
        onChange?.(e)
        queueMicrotask(resize)
      }}
      className={[
        'w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition resize-none min-h-[72px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
