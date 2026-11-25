import { t } from '../i18n';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { Icon } from '../components/Icon';

export const MINECRAFT_NAME_PATTERN = '[A-Za-z0-9_.*\\-]{3,32}';

export function needsMinecraftName(err: unknown): boolean {
  return err instanceof ApiError && (err.code === 'minecraft_username_required' || err.code === 'minecraft_username_invalid');
}

export function MinecraftNamePrompt({ initial, busy, onSubmit }: { initial: string; busy: boolean; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initial);
  const valid = /^[A-Za-z0-9_.*-]{3,32}$/.test(name.trim());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (valid) onSubmit(name.trim());
  }

  return (
    <form className="mc-name-prompt error-in" onSubmit={submit}>
      <label>
        <span className="field-label">{t('Minecraft-neved')}</span>
        <input autoFocus maxLength={32} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('pl. Steve')} autoComplete="nickname" />
      </label>
      <p className="muted small">{t('A fizetést a Tebex ehhez a névhez köti. A következő vásárlásnál már emlékszünk rá.')}</p>
      <button type="submit" className={`btn-primary btn-block ${busy ? 'is-loading' : ''}`} disabled={busy || !valid}>
        {busy && <span className="btn-spinner" aria-hidden="true" />}{t('Tovább a fizetéshez')}{' '}<Icon name="arrow-right" size={16} />
      </button>
    </form>
  );
}
