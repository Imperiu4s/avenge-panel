import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { Icon } from './Icon';
import type { CreateSignatureRequest, FindingSeverity, SignatureDto } from '../api/types';

const SEVERITIES: FindingSeverity[] = ['Info', 'Low', 'Medium', 'High', 'Critical'];

const emptyForm: CreateSignatureRequest = { game: 'generic', name: '', severity: 'Medium' };

export function SignatureCatalogSection() {
  const [signatures, setSignatures] = useState<SignatureDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateSignatureRequest>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      setSignatures(await api.listAdminSignatures());
    } catch {
      setListError('Nem sikerült betölteni a katalógust.');
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
      await api.createAdminSignature({
        game: form.game.trim().toLowerCase(),
        name: form.name.trim(),
        processName: form.processName?.trim() || undefined,
        sha256: form.sha256?.trim() || undefined,
        severity: form.severity
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Nem sikerült létrehozni a bejegyzést.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(signature: SignatureDto) {
    try {
      const updated = await api.updateAdminSignature(signature.id, { isActive: !signature.isActive });
      setSignatures((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      setListError('Nem sikerült módosítani az állapotot.');
    }
  }

  async function handleDelete(signature: SignatureDto) {
    if (!window.confirm(`Biztosan törlöd a(z) "${signature.name}" bejegyzést?`)) {
      return;
    }
    try {
      await api.deleteAdminSignature(signature.id);
      setSignatures((prev) => prev.filter((s) => s.id !== signature.id));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült törölni a bejegyzést.');
    }
  }

  return (
    <div className="panel-grid" style={{ marginTop: 24 }}>
      <div className="card">
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="server" size={20} /> Ismert csaló-jelek katalógusa
        </h2>
        <p className="muted small" style={{ marginTop: -8 }}>
          Ez a lista minden kliens induláskor szinkronizálódik - egy új bejegyzés appfrissítés nélkül azonnal érvénybe lép.
        </p>
        <div className="table-scroll">
          <table className="sessions-table admin-users-table">
            <thead>
              <tr>
                <th>Játék</th>
                <th>Név</th>
                <th>Súlyosság</th>
                <th>Állapot</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {signatures.map((s) => (
                <tr key={s.id}>
                  <td className="mono small">{s.game}</td>
                  <td>{s.name}</td>
                  <td><span className={`severity-badge severity-${s.severity.toLowerCase()}`}>{s.severity}</span></td>
                  <td>
                    <span className={`status-badge ${s.isActive ? 'status-completed' : 'status-interrupted'}`}>
                      {s.isActive ? 'Aktív' : 'Inaktív'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <button className="btn-secondary btn-tiny" onClick={() => handleToggleActive(s)}>
                      {s.isActive ? 'Deaktiválás' : 'Aktiválás'}
                    </button>
                    <button className="btn-secondary btn-tiny btn-danger" onClick={() => handleDelete(s)}>
                      Törlés
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && signatures.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">Nincs egyedi bejegyzés (a kliens beégetett listája attól még teljes értékű).</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {listError && <p className="error-text">{listError}</p>}
      </div>

      <div className="card generate-card">
        <h2><Icon name="plus" size={18} /> Új csaló-jel</h2>
        <form onSubmit={handleCreate}>
          <label className="field-label">Játék (pl. "generic" vagy "minecraft")</label>
          <input type="text" value={form.game} onChange={(e) => setForm((f) => ({ ...f, game: e.target.value }))} required />

          <label className="field-label">Név (ez alapján illeszkedik fájl-/mappanévre)</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />

          <label className="field-label">Folyamatnév-minta (opcionális, regex)</label>
          <input
            type="text"
            value={form.processName ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, processName: e.target.value }))}
          />

          <label className="field-label">SHA-256 (opcionális)</label>
          <input
            type="text"
            value={form.sha256 ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, sha256: e.target.value }))}
          />

          <label className="field-label">Súlyosság</label>
          <select
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as FindingSeverity }))}
            className="role-select role-select-full"
          >
            {SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>

          <button className="btn-primary" type="submit" disabled={isCreating}>
            {isCreating ? 'Létrehozás...' : 'Létrehozás'}
          </button>
          {createError && <p className="error-text">{createError}</p>}
        </form>
      </div>
    </div>
  );
}
