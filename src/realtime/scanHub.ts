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

let connection: signalR.HubConnection | null = null;

/// Egyetlen, megosztott hub-kapcsolat az egész appban (nem oldalanként újat
/// nyitunk) - a Panel és egy jövőbeli Dashboard is ugyanezt hívná.
export function connectScanHub(): signalR.HubConnection {
  if (connection) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hub/scan`, {
      accessTokenFactory: () => getStoredToken() ?? '',
      // Nincs cookie-alapú hitelesítés - a JWT a query stringben megy (lásd
      // Avenge.Api Program.cs OnMessageReceived) - így nincs szükség
      // AllowCredentials()-re a backend CORS policy-jében.
      withCredentials: false,
      // A backend jelenleg egy kézzel írt Node.js proxy mögött fut (lásd
      // server/PTERODACTYL_DEPLOY.md), ami NEM támogatja a WebSocket upgrade-et,
      // a Server-Sent Events pedig a proxy előtt futó compression()
      // middleware-rel ütközik (a tartós, streamelt választ tömöríteni
      // próbálja, ami "Handshake was canceled" hibával megszakítja a
      // kapcsolatot, majd egy végtelen újracsatlakozási hurkot indít el) - ez
      // éles teszttel felfedezett, valódi hiba volt. Amíg ez nincs a proxy
      // oldalán javítva, kényszerítve Long Pollingra állunk: ez ismételt,
      // sima (nem streamelt) HTTP kérés-válasz párokból áll, amit a
      // compression middleware nem tör el.
      transport: signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect()
    .build();

  connection.start().catch((err) => {
    console.error('[scanHub] Nem sikerült csatlakozni:', err);
  });

  return connection;
}

export function disconnectScanHub() {
  connection?.stop();
  connection = null;
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
