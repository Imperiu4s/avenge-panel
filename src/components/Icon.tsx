import type { ReactElement } from 'react';

export type IconName =
  | 'rocket'
  | 'bolt'
  | 'layers'
  | 'shield'
  | 'headset'
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
  | 'cart'
  | 'globe'
  | 'server'
  | 'ban'
  | 'plus'
  | 'arrow-right';

const PATHS: Record<IconName, ReactElement> = {
  rocket: (
    <>
      <path d="M12 2.5c2.4 1.9 4 5.3 4 8.7 0 2-.5 4-1.6 5.9L12 20l-2.4-2.9C8.5 15.2 8 13.2 8 11.2c0-3.4 1.6-6.8 4-8.7Z" />
      <circle cx="12" cy="10.5" r="1.6" />
      <path d="M8.3 15.8 5.8 18v2.7l2.5-1 1.1-2.4M15.7 15.8l2.5 2.2v2.7l-2.5-1-1.1-2.4" />
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
  headset: (
    <>
      <path d="M4 13.5v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M20 19.5a3.5 3.5 0 0 1-3.5 3.5H14" />
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
  cart: (
    <>
      <path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20.5 8H6" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
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
  'arrow-right': <path d="M4 12h16M14 6l6 6-6 6" />
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
