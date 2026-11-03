/// Csak MEGJELENÍTÉSRE bontja ki a staff JWT payload-ját (sub/org/role/exp) - a
/// JWT nincs titkosítva, csak base64url-kódolva, a szerver továbbra is
/// aláírás szerint ellenőrzi minden kérésnél. Jogosultság-döntésre nem használjuk,
/// csak a felület alakítására és a lejárt munkamenet felismerésére.
export interface StaffTokenClaims {
  userId: string | null;
  organizationId: string | null;
  role: string | null;
  /// A lejárat ideje ezredmásodpercben (Date.now() skálán), ha ismert.
  expiresAt: number | null;
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
    const claims = JSON.parse(json) as Record<string, string | number>;
    // A szerver a ClaimTypes.Role-t közvetlenül JwtSecurityToken konstruktorral
    // adja ki (nincs outbound claim-mapping), ezért a payloadban a teljes
    // URI kulcs alatt szerepel, nem az egyszerű "role" néven.
    const roleClaimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    return {
      userId: (claims.sub as string) ?? null,
      organizationId: (claims.org as string) ?? null,
      role: ((claims[roleClaimKey] ?? claims.role) as string) ?? null,
      expiresAt: typeof claims.exp === 'number' ? claims.exp * 1000 : null
    };
  } catch {
    return { userId: null, organizationId: null, role: null, expiresAt: null };
  }
}
