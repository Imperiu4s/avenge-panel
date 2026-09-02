/// Csak MEGJELENÍTÉSRE bontja ki a staff JWT payload-ját (sub/org/role) - a
/// JWT nincs titkosítva, csak base64url-kódolva, a szerver továbbra is
/// aláírás szerint ellenőrzi minden kérésnél. Nem használjuk jogosultság-
/// döntésre, csak az Account oldal információs megjelenítésére.
export interface StaffTokenClaims {
  userId: string | null;
  organizationId: string | null;
  role: string | null;
}

export function decodeStaffToken(token: string): StaffTokenClaims {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    const claims = JSON.parse(json) as Record<string, string>;
    // A szerver a ClaimTypes.Role-t közvetlenül JwtSecurityToken konstruktorral
    // adja ki (nincs outbound claim-mapping), ezért a payloadban a teljes
    // "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role" kulcs alatt
    // szerepel, nem az egyszerű "role" néven.
    const roleClaimKey = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role';
    return {
      userId: claims.sub ?? null,
      organizationId: claims.org ?? null,
      role: claims[roleClaimKey] ?? claims.role ?? null
    };
  } catch {
    return { userId: null, organizationId: null, role: null };
  }
}
