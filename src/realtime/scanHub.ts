import * as signalR from '@microsoft/signalr';
import { API_BASE } from '../api/config';
import { getStoredToken } from '../api/client';

// Az esemény-nevek/payload-ok a backend Hubs/ScanEventBroadcaster.cs-ével
// egyeznek meg - ha ott változik valami, itt is módosítani kell.
export interface SessionStatusChangedEvent {
  code: string;
  status: string;
  resultId: string | null;
  verdict: string | null;
}

export interface ScanProgressEvent {
  code: string;
  percent: number;
  statusText: string;
}

const MAX_RETRY_DELAY_MS = 60000;

let connection: signalR.HubConnection | null = null;

/// A withAutomaticReconnect csak egy már felépült kapcsolatot állít helyre, és
/// néhány próba után feladja - enélkül egy induláskori hálózati hiba után az
/// élő nézet az oldal újratöltéséig némán leállna.
function startWithRetry(hub: signalR.HubConnection, attempt = 0) {
  hub.start().catch((err) => {
    console.error('[scanHub] Nem sikerült csatlakozni:', err);
    scheduleRetry(hub, attempt + 1);
  });
}

function scheduleRetry(hub: signalR.HubConnection, attempt: number) {
  const delay = Math.min(MAX_RETRY_DELAY_MS, 2000 * 2 ** attempt);
  window.setTimeout(() => {
    if (connection === hub && hub.state === signalR.HubConnectionState.Disconnected && getStoredToken()) {
      startWithRetry(hub, attempt);
    }
  }, delay);
}

/// Egyetlen, megosztott hub-kapcsolat az egész appban (nem oldalanként újat
/// nyitunk) - a Panel és egy jövőbeli Dashboard is ugyanezt hívná.
export function connectScanHub(): signalR.HubConnection {
  if (connection) {
    return connection;
  }

  const hub = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hub/scan`, {
      accessTokenFactory: () => getStoredToken() ?? '',
      // Nincs cookie-alapú hitelesítés - a JWT a query stringben megy (lásd
      // Avenge.Api Program.cs OnMessageReceived) - így nincs szükség
      // AllowCredentials()-re a backend CORS policy-jében.
      withCredentials: false,
      // A dedikált szerver hostja (server/node-host) valódi WebSocketet
      // továbbít, ezért elsődlegesen azt használjuk. Ha egy hálózat (pl. céges
      // proxy) blokkolja a WebSocketet, Long Pollingra esik vissza. A
      // Server-Sent Events szándékosan kimarad: a régi, megosztott szerveren
      // egy tömörítő proxy "Handshake was canceled" hibával törte el.
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect()
    .build();

  hub.onclose(() => {
    if (connection === hub) {
      scheduleRetry(hub, 1);
    }
  });

  connection = hub;
  startWithRetry(hub);

  return hub;
}

export function disconnectScanHub() {
  const hub = connection;
  connection = null;
  hub?.stop();
}

export function onSessionStatusChanged(handler: (event: SessionStatusChangedEvent) => void): () => void {
  const hub = connectScanHub();
  hub.on('SessionStatusChanged', handler);
  return () => hub.off('SessionStatusChanged', handler);
}

export function onScanProgress(handler: (event: ScanProgressEvent) => void): () => void {
  const hub = connectScanHub();
  hub.on('ScanProgress', handler);
  return () => hub.off('ScanProgress', handler);
}
