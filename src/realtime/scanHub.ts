import * as signalR from '@microsoft/signalr';
import { API_BASE } from '../api/config';
import { getStoredToken } from '../api/client';

// Az esemény-nevek/payload-ok a backend Hubs/ScanEventBroadcaster.cs-ével
// egyeznek meg - ha ott változik valami, itt is módosítani kell.
export interface SessionStatusChangedEvent {
  code: string;
  status: string;
  resultId: string | null;
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
      withCredentials: false
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
