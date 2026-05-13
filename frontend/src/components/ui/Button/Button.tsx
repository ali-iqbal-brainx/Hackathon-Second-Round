import type { ButtonProps } from './Button.types'

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn btn--primary',
  secondary: 'btn btn--secondary',
  ghost: 'btn btn--ghost',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${variantClass[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
