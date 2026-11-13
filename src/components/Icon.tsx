import type { ReactElement } from 'react';

export type IconName =
  | 'bolt'
  | 'layers'
  | 'shield'
  | 'key'
  | 'fingerprint'
  | 'users'
  | 'video'
  | 'gamepad'
  | 'save'
  | 'trash'
  | 'bug'
  | 'search'
  | 'info'
  | 'globe'
  | 'server'
  | 'ban'
  | 'plus'
  | 'arrow-right'
  | 'home'
  | 'radar'
  | 'user'
  | 'logout'
  | 'copy'
  | 'check'
  | 'download'
  | 'eye'
  | 'eye-off'
  | 'dice'
  | 'lock'
  | 'link'
  | 'clock'
  | 'cpu'
  | 'file'
  | 'drive'
  | 'alert'
  | 'x'
  | 'history'
  | 'activity'
  | 'settings'
  | 'share'
  | 'target'
  | 'cart'
  | 'tag'
  | 'package'
  | 'card'
  | 'star'
  | 'scale'
  | 'refresh';

const PATHS: Record<IconName, ReactElement> = {
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.600-4.400M8.2 13.2l7.6 4.4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  layers: (
    <>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 5.5v5.4c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10V5.5L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11.2 11.8 19 4l2 2-1.8 1.8L21 9.6l-2.2 2.2-1.8-1.8-1.8 1.8" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 2.5a7.5 7.5 0 0 1 7.5 7.5c0 2.8-.3 5-1.4 7.5" />
      <path d="M12 2.5A7.5 7.5 0 0 0 4.5 10c0 1.6.1 3-.5 5" />
      <path d="M8 10a4 4 0 0 1 8 0c0 4-1 7-3 10" />
      <path d="M12 10v1.5c0 3.8-.9 6.6-2.7 9" />
      <path d="M15.5 10.5c0 4-.8 6.8-2.6 9.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M15.7 13a5 5 0 0 1 4.8 5" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="12" height="11" rx="2" />
      <path d="M15 10.5 21 7v10l-6-3.5Z" />
    </>
  ),
  gamepad: (
    <>
      <rect x="2.5" y="8" width="19" height="10" rx="5" />
      <path d="M7 11v4M5 13h4" />
      <circle cx="16" cy="12" r="1" />
      <circle cx="18.5" cy="14.5" r="1" />
    </>
  ),
  save: (
    <>
      <path d="M5 3.5h11L20 8v12.5H5z" />
      <path d="M8 3.5V9h8V3.5" />
      <path d="M8 14h8v6.5H8z" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3V7" />
      <path d="M6.5 7 7.3 20a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10.2 11v6.5M13.8 11v6.5" />
    </>
  ),
  bug: (
    <>
      <path d="M9 8.5h6M12 8.5v11" />
      <ellipse cx="12" cy="14" rx="5" ry="6" />
      <path d="M5 12H2.5M5 17H2.5M19 12h2.5M19 17h2.5" />
      <path d="M9 6.5 7 4M15 6.5 17 4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 8v.01" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-6-3.8-9s1.3-6.5 3.8-9Z" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4" width="18" height="6.5" rx="1.5" />
      <rect x="3" y="13.5" width="18" height="6.5" rx="1.5" />
      <path d="M7 7.25h.01M7 16.75h.01" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.5 5.5 13 13" />
    </>
  ),
  plus: <path d="M12 4.5v15M4.5 12h15" />,
  'arrow-right': <path d="M4 12h16M14 6l6 6-6 6" />,
  home: <path d="M4 11.5 12 4l8 7.5M6.5 9.5V20h11V9.5M10 20v-5.5h4V20" />,
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="m12 12 6.4-6.4M12 3v2M21 12h-2M12 21v-2M3 12h2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
  logout: <path d="M14 4h5.5v16H14M10 8l-4.5 4L10 16M5.5 12H15" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="1.5" />
      <path d="M15.5 8.5V5.5A1.5 1.5 0 0 0 14 4H5.5A1.5 1.5 0 0 0 4 5.5V14a1.5 1.5 0 0 0 1.5 1.5h3" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  download: <path d="M12 3.5v12M6.5 10.5 12 16l5.5-5.5M4 20.5h16" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M9.5 5.8A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.200 7.300A16 16 0 0 0 2.5 12s3.5 6.5 9.5 6.5a9.300 9.300 0 0 0 4.200-1" />
      <path d="m3.5 3.5 17 17M10 10a2.8 2.8 0 0 0 4 4" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" strokeWidth={2.4} />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="1.8" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2" />
    </>
  ),
  link: <path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 6M14 10a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.300-1.200" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5V12l3.5 2" />
    </>
  ),
  cpu: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
      <path d="M10 2.5v4M14 2.5v4M10 17.5v4M14 17.5v4M2.5 10h4M2.5 14h4M17.5 10h4M17.5 14h4" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8.5L19 7.5V21H6Z" />
      <path d="M14 3v5h5M9 13h6M9 16.5h6" />
    </>
  ),
  drive: (
    <>
      <path d="M3.5 14 6.5 5h11l3 9v5.5h-17Z" />
      <path d="M3.5 14h17M16.5 17h.01" />
    </>
  ),
  alert: <path d="M12 3.5 2.5 20.5h19ZM12 10v4.5M12 17.5v.01" />,
  x: <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />,
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.700-6.200L3.5 8.5" />
      <path d="M3.5 4v4.5H8M12 7.5V12l3 2" />
    </>
  ),
  activity: <path d="M2.5 12h4l3-8 5 16 3-8h4" />,
  cart: (
    <>
      <path d="M3 4h2.4l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.4-1.1L21 8H6.2" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.5 1.5 0 0 1 0 2.1l-7 7a1.5 1.5 0 0 1-2.1 0Z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  package: (
    <>
      <path d="m12 2.8 8.5 4.6v9.2L12 21.2l-8.5-4.6V7.4Z" />
      <path d="m3.8 7.6 8.2 4.5 8.2-4.5M12 12.1v9M7.8 5.1l8.4 4.6" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
      <path d="M2.5 9.5h19M6 15h4" />
    </>
  ),
  star: <path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z" />,
  scale: (
    <>
      <path d="M12 3.5v17M7 20.5h10M4.5 7h15M12 5l-7.5 2M12 5l7.5 2" />
      <path d="M4.5 7 2 13a2.6 2.6 0 0 0 5 0ZM19.5 7 17 13a2.6 2.6 0 0 0 5 0Z" />
    </>
  ),
  refresh: <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.2h-4.2" />
};

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
