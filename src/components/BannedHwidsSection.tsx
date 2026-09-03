import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { Icon } from './Icon';
import type { BannedHwidView } from '../api/types';

export function BannedHwidsSection() {
  const [banned, setBanned] = useState<BannedHwidView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [hwid, setHwid] = useState('');
  const [reason, setReason] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      setBanned(await api.listAdminBannedHwids());
    } catch {
      setListError('Nem sikerült betölteni a listát.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      await api.createAdminBannedHwid({ hwid: hwid.trim(), reason: reason.trim() || undefined });
      setHwid('');
      setReason('');
      await load();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? 'Ez a HWID már szerepel a listán.'
          : err instanceof ApiError
            ? err.message
            : 'Nem sikerült hozzáadni.';
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(entry: BannedHwidView) {
    if (!window.confirm(`Biztosan törlöd a tiltást erről a HWID-ről?\n${entry.hwid}`)) {
      return;
    }
    try {
      await api.deleteAdminBannedHwid(entry.id);
      setBanned((prev) => prev.filter((b) => b.id !== entry.id));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült törölni.');
    }
  }

  return (
    <div className="panel-grid" style={{ marginTop: 24 }}>
      <div className="card">
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="ban" size={20} /> HWID-feketelista
        </h2>
        <p className="muted small" style={{ marginTop: -8 }}>
          Ha egy vizsgálat egy itt szereplő HWID-ről érkezik, a rendszer automatikusan UNLEGIT-re állítja - más
          Minecraft-fiókkal sem lehet "tisztán" átmenni ugyanarról a gépről.
        </p>
        <div className="table-scroll">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>HWID</th>
                <th>Indoklás</th>
                <th>Hozzáadva</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {banned.map((b) => (
                <tr key={b.id}>
                  <td className="mono small">{b.hwid}</td>
                  <td>{b.reason ?? <span className="muted">-</span>}</td>
                  <td>{new Date(b.createdAt).toLocaleString('hu-HU')}</td>
                  <td className="admin-actions">
                    <button className="btn-secondary btn-tiny btn-danger" onClick={() => handleDelete(b)}>
                      Törlés
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && banned.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">Nincs kitiltott HWID.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {listError && <p className="error-text">{listError}</p>}
      </div>

      <div className="card generate-card">
        <h2><Icon name="plus" size={18} /> HWID kitiltása</h2>
        <form onSubmit={handleCreate}>
          <label className="field-label">HWID</label>
          <input type="text" value={hwid} onChange={(e) => setHwid(e.target.value)} required />

          <label className="field-label">Indoklás (opcionális)</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} />

          <button className="btn-primary" type="submit" disabled={isCreating}>
            {isCreating ? 'Hozzáadás...' : 'Kitiltás'}
          </button>
          {createError && <p className="error-text">{createError}</p>}
        </form>
      </div>
    </div>
  );
}
