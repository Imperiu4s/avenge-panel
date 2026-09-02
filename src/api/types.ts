// Ugyanaz a szerkezet, mint a backend Contracts/SessionContracts.cs DTO-i
// (System.Text.Json alapból camelCase-re szerializál minimal API Results.Ok()-nál).

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
}

export interface CreateSessionResponse {
  code: string;
  expiresAt: string;
}

export type SessionStatus =
  | 'Pending'
  | 'ClientConnected'
  | 'Scanning'
  | 'Completed'
  | 'Interrupted'
  | 'Expired';

export interface SessionListItem {
  code: string;
  resultIdHash: string | null;
  status: SessionStatus;
  createdAt: string;
  completedAt: string | null;
  verdict: ScanVerdict | null;
}

export interface SystemFingerprintDto {
  hwid: string;
  hostname: string;
  osVersion: string;
  cpuModel: string | null;
  gpuModel: string | null;
  ramTotalMb: number | null;
  recycleBinLastEmptiedAt: string | null;
}

export type FindingCategory =
  | 'CheatSignature'
  | 'SuspiciousSavedFile'
  | 'SuspiciousDeletedFile'
  | 'AltAccount'
  | 'RecordingSoftware'
  | 'XrayTexturePack'
  | 'Injector'
  | 'VmSandbox'
  | 'TamperAttempt';

export type FindingSeverity = 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface FindingDto {
  category: FindingCategory;
  severity: FindingSeverity;
  label: string;
  source: string;
  filePath: string | null;
  fileHashSha256: string | null;
  foundAt: string | null;
  details: Record<string, string> | null;
}

export type ScanVerdict = 'Legit' | 'Unlegit' | 'Inconclusive';

export interface ScanResultView {
  id: string;
  verdict: ScanVerdict;
  system: SystemFingerprintDto;
  clientVersion: string;
  scanDurationMs: number;
  detectedGame: string | null;
  createdAt: string;
  findings: FindingDto[];
}
