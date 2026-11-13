import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../api/client';
import { rolesApi, type PermissionInfo, type RolePermissions } from '../../api/profile';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';

type EditableRole = 'admin' | 'staff';

const ROLE_COLUMNS: { key: EditableRole; label: string }[] = [
  { key: 'admin', label: 'Admin' },
  { key: 'staff', label: 'Staff' }
];

function sameSet(a: Set<string>, b: string[]): boolean {
  return a.size === b.length && b.every((x) => a.has(x));
}

function GroupToggle({ items, selected, onChange, label }: { items: PermissionInfo[]; selected: Set<string>; onChange: (on: boolean) => void; label: string }) {
  const count = items.filter((p) => selected.has(p.key)).length;
  return (
    <input
      type="checkbox"
      className="role-check"
      aria-label={label}
      checked={count === items.length}
      ref={(el) => { if (el) el.indeterminate = count > 0 && count < items.length; }}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

export function RolesAdminTab() {
  const { refreshUser } = useAuth();
  const [data, setData] = useState<RolePermissions | null>(null);
  const [draft, setDraft] = useState<Record<EditableRole, Set<string>>>({ admin: new Set(), staff: new Set() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function apply(next: RolePermissions) {
    setData(next);
    setDraft({ admin: new Set(next.admin), staff: new Set(next.staff) });
  }

  useEffect(() => {
    rolesApi.get().then(apply).catch((err) => setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a rangokat.'));
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PermissionInfo[]>();
    for (const p of data?.catalog ?? []) map.set(p.group, [...(map.get(p.group) ?? []), p]);
    return [...map.entries()];
  }, [data]);

  if (!data) {
    return <section className="card">{error ? <p className="error-text">{error}</p> : <><Skeleton width="50%" /><Skeleton width="85%" style={{ marginTop: 12 }} /></>}</section>;
  }

  const dirty = !sameSet(draft.admin, data.admin) || !sameSet(draft.staff, data.staff);

  function toggle(role: EditableRole, keys: string[], on: boolean) {
    setDraft((d) => {
      const next = new Set(d[role]);
      for (const k of keys) {
        if (on) next.add(k);
        else next.delete(k);
      }
      return { ...d, [role]: next };
    });
    setNotice(null);
  }

  async function save(body: Parameters<typeof rolesApi.save>[0], message: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      apply(await rolesApi.save(body));
      refreshUser();
      setNotice(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült menteni.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="crown" size={18} /> Rangok és jogok</h2>
          <span className="muted small">Csak a Tulajdonos látja és módosíthatja</span>
        </div>
        <p className="muted small">
          A <strong>Tulajdonos</strong> mindenhez hozzáfér, és csak ő adhat Tulajdonos rangot. Az <strong>Admin</strong> és a <strong>Staff</strong> rang jogait itt állíthatod be;
          a változás azonnal érvényes, újra belépni nem kell. Rangot a Felhasználók fülön adhatsz.
        </p>

        <div className="table-scroll">
          <table className="data-table roles-table">
            <thead>
              <tr>
                <th>Jog</th>
                <th className="align-center"><Icon name="crown" size={13} /> Tulajdonos</th>
                {ROLE_COLUMNS.map((r) => (
                  <th key={r.key} className="align-center">
                    {r.label}
                    {(r.key === 'admin' ? data.adminCustomized : data.staffCustomized)
                      ? <span className="role-custom-dot" title="Egyedi beállítás" />
                      : null}
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map(([group, items]) => (
              <tbody key={group}>
                <tr className="roles-group-row">
                  <th scope="rowgroup">{group}</th>
                  <td className="align-center"><Icon name="check" size={14} /></td>
                  {ROLE_COLUMNS.map((r) => (
                    <td key={r.key} className="align-center">
                      <GroupToggle
                        items={items}
                        selected={draft[r.key]}
                        label={`${group}: mind (${r.label})`}
                        onChange={(on) => toggle(r.key, items.map((p) => p.key), on)}
                      />
                    </td>
                  ))}
                </tr>
                {items.map((p) => (
                  <tr key={p.key}>
                    <td>
                      <span className="roles-perm">
                        <strong>{p.label}</strong>
                        <small className="muted">{p.description}</small>
                      </span>
                    </td>
                    <td className="align-center"><span className="role-locked"><Icon name="check" size={13} /></span></td>
                    {ROLE_COLUMNS.map((r) => (
                      <td key={r.key} className="align-center">
                        <input
                          type="checkbox"
                          className="role-check"
                          aria-label={`${p.label} (${r.label})`}
                          checked={draft[r.key].has(p.key)}
                          onChange={(e) => toggle(r.key, [p.key], e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <div className="settings-actions section-gap">
        <span className="roles-reset">
          <button type="button" className="btn-ghost btn-tiny" disabled={busy || !data.adminCustomized} onClick={() => save({ resetAdmin: true }, 'Az Admin rang visszaállt az alapértelmezésre.')}>
            <Icon name="refresh" size={13} /> Admin alapértelmezés
          </button>
          <button type="button" className="btn-ghost btn-tiny" disabled={busy || !data.staffCustomized} onClick={() => save({ resetStaff: true }, 'A Staff rang visszaállt az alapértelmezésre.')}>
            <Icon name="refresh" size={13} /> Staff alapértelmezés
          </button>
        </span>
        <button
          type="button"
          className={`btn-primary ${busy ? 'is-loading' : ''}`}
          disabled={busy || !dirty}
          onClick={() => save({ admin: [...draft.admin], staff: [...draft.staff] }, 'Jogok mentve. Minden tag azonnal az új jogokkal dolgozik.')}
        >
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          Mentés
        </button>
      </div>
      {notice && <p className="success-text"><Icon name="check" size={15} /> {notice}</p>}
      {error && <p className="error-text error-in">{error}</p>}
    </>
  );
}
