interface ErrorMessageProps {
  message: string | null | undefined
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  )
}
