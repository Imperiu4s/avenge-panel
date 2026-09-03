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
  | 'TamperAttempt'
  | 'VpnOrProxy';

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
  minecraftUsername: string | null;
}

// ── Admin (tulajdonos) ──
export type UserRole = 'Admin' | 'Staff';

export interface AdminUserView {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  role?: UserRole;
  isActive?: boolean;
}

// ── Ismert csaló-jel katalógus (szerver-vezérelt) ──
export interface SignatureDto {
  id: string;
  game: string;
  name: string;
  sha256: string | null;
  processName: string | null;
  severity: FindingSeverity;
  isActive: boolean;
}

export interface CreateSignatureRequest {
  game: string;
  name: string;
  sha256?: string;
  processName?: string;
  severity: FindingSeverity;
}

export interface UpdateSignatureRequest {
  isActive?: boolean;
}

// ── HWID-feketelista ──
export interface BannedHwidView {
  id: string;
  hwid: string;
  reason: string | null;
  createdAt: string;
}

export interface CreateBannedHwidRequest {
  hwid: string;
  reason?: string;
}
