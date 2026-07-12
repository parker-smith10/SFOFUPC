export default function Spinner({ full = false }) {
  const spinner = (
    <div
      className="h-8 w-8 animate-spin rounded-full border-4 border-osu-black/10 border-t-osu-orange"
      role="status"
      aria-label="Loading"
    />
  )

  if (!full) return spinner

  return <div className="flex min-h-[50vh] items-center justify-center">{spinner}</div>
}
