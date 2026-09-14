import type { SVGProps } from 'react'

export type IconName =
  | 'search'
  | 'x'
  | 'chevron-down'
  | 'chevron-right'
  | 'arrow-right'
  | 'arrow-left'
  | 'external'
  | 'sliders'
  | 'alert'
  | 'refresh'
  | 'quote'
  | 'globe'
  | 'calendar'
  | 'layers'
  | 'book-open'
  | 'retracted'
  | 'check'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
  x: <path d="M18 6L6 18M6 6l12 12" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14L21 3" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </>
  ),
  quote: (
    <>
      <path d="M10 11H6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4z" />
      <path d="M19 11h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),
  calendar: (
    <>
      <path d="M4 5h16v15H4z" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  'book-open': (
    <>
      <path d="M12 6c-2-2-5-3-8-3v15c3 0 6 1 8 3 2-2 5-3 8-3V3c-3 0-6 1-8 3z" />
      <path d="M12 6v15" />
    </>
  ),
  retracted: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10.5l7 7M15.5 10.5l-7 7" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
