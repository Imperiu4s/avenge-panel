// Közös alap-URL feloldás a REST API-klienshez (client.ts) ÉS a SignalR hub
// kapcsolathoz (realtime/scanHub.ts) - lásd a részletes indoklást ott.
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/avenge';
