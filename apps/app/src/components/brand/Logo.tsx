/**
 * StubRamp wordmark — a squared tile with a "ramp" glyph, optionally followed
 * by the wordmark text. Colors are parameterized so it reads correctly on both
 * the dark auth panel (accent tile) and the light app sidebar (ink tile).
 */
export function Logo({
  size = 22,
  wordmark = true,
  tileColor = 'var(--ink-900)',
  glyphColor = 'var(--accent-500)',
  className,
}: {
  size?: number
  wordmark?: boolean
  /** Fill of the square tile. */
  tileColor?: string
  /** Fill of the ramp glyph. */
  glyphColor?: string
  className?: string
}) {
  return (
    <span className={`flex items-center gap-[9px] ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        className="block shrink-0"
        aria-hidden
      >
        <rect width="22" height="22" fill={tileColor} />
        <path d="M4 17 L11 5 L18 17 Z" fill={glyphColor} />
      </svg>
      {wordmark && (
        <span className="text-xl font-bold tracking-[-0.03em]">StubRamp</span>
      )}
    </span>
  )
}
