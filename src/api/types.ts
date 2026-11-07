// Ugyanaz a szerkezet, mint a backend Contracts/SessionContracts.cs DTO-i
// (System.Text.Json alapból camelCase-re szerializál minimal API Results.Ok()-nál).

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
}

export interface CurrentUserView {
  id: string;
  email: string;
  role: UserRole;
  organizationName: string;
  createdAt: string;
  lastLoginAt: string | null;
  /// Az Admin beállításaiból: törölheti-e a saját vizsgálatait, készíthet-e megosztó linket.
  canDeleteOwnScans?: boolean;
  canShareResults?: boolean;
  seesOnlyOwnScans?: boolean;
}

export interface ClientReleaseView {
  version: string;
  sizeBytes: number;
  publishedAt: string;
  notes: string | null;
}

export interface DownloadTicketView {
  ticket: string;
  expiresAt: string;
}

export interface DownloadStatusView {
  version: string;
  sizeBytes: number;
  publishedAt: string;
  sessionExpiresAt: string;
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
  createdByMe?: boolean;
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
  | 'VpnOrProxy'
  | 'MouseSoftware';

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
  /// A megosztott nézetben nincs (null).
  sessionCode?: string | null;
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

// ── Megosztó link (bejelentkezés nélkül, 3 napig érvényes) ──
export interface CreateShareLinkResponse {
  id: string;
  token: string;
  expiresAt: string;
}

export interface ShareLinkView {
  id: string;
  createdAt: string;
  expiresAt: string;
  createdByEmail: string | null;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface SharedResultView {
  result: ScanResultView;
  expiresAt: string;
  organizationName: string;
}

// ── Admin: áttekintés, vizsgálatok, beállítások, napló ──
export interface DailyCount {
  date: string;
  scans: number;
  legit: number;
  inconclusive: number;
  unlegit: number;
}

export interface StaffActivity {
  userId: string;
  email: string;
  scans: number;
  unlegit: number;
  lastScanAt: string | null;
}

export interface AdminOverviewView {
  users: number;
  activeUsers: number;
  admins: number;
  totalScans: number;
  completed: number;
  legit: number;
  unlegit: number;
  inconclusive: number;
  unfinished: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  activeShareLinks: number;
  bannedHwids: number;
  daily: DailyCount[];
  staff: StaffActivity[];
}

export interface AdminSessionView {
  code: string;
  resultIdHash: string | null;
  status: SessionStatus;
  verdict: ScanVerdict | null;
  createdAt: string;
  completedAt: string | null;
  createdByUserId: string;
  createdByEmail: string | null;
  minecraftUsername: string | null;
  hostname: string | null;
  findingCount: number;
}

export interface AdminSessionPage {
  items: AdminSessionView[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminSessionQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  verdict?: ScanVerdict | '';
  status?: string;
  q?: string;
}

export interface PurgeHistoryRequest {
  userId?: string;
  olderThanDays?: number;
  verdict?: ScanVerdict;
  onlyUnfinished?: boolean;
  all?: boolean;
}

export interface DeletedCountView {
  deleted: number;
}

export interface OrganizationSettingsView {
  organizationName: string;
  sessionCodeMinutes: number;
  retentionDays: number;
  shareLinksEnabled: boolean;
  staffCanShare: boolean;
  staffCanDeleteOwnScans: boolean;
  staffSeesOnlyOwnScans: boolean;
  shareLinkDays: number;
  updatedAt: string;
}

export type UpdateOrganizationSettingsRequest = Partial<Omit<OrganizationSettingsView, 'shareLinkDays' | 'updatedAt'>>;

export interface AuditEntryView {
  id: string;
  createdAt: string;
  action: string;
  userEmail: string | null;
  targetType: string;
  target: string | null;
  ipAddress: string | null;
  details: string | null;
}

export interface AuditPage {
  items: AuditEntryView[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminShareLinkView {
  id: string;
  resultIdHash: string | null;
  sessionCode: string | null;
  verdict: ScanVerdict | null;
  createdAt: string;
  expiresAt: string;
  createdByEmail: string | null;
  viewCount: number;
  lastViewedAt: string | null;
}
