import { t as tr } from '../../i18n';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { discordAdminApi, type DiscordChannel, type DiscordEmbedFieldInput, type DiscordSendRequest } from '../../api/store';
import { Icon } from '../Icon';

const DRAFT_KEY = 'avenge.discordDraft';

interface Draft {
  channelId: string;
  content: string;
  useEmbed: boolean;
  title: string;
  url: string;
  color: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  footer: string;
  timestamp: boolean;
  fields: DiscordEmbedFieldInput[];
  buttons: { label: string; url: string }[];
  allowMentions: boolean;
}

const EMPTY: Draft = {
  channelId: '',
  content: '',
  useEmbed: true,
  title: '',
  url: '',
  color: '#ff2d37',
  description: '',
  imageUrl: '',
  thumbnailUrl: '',
  footer: 'avenge.hu',
  timestamp: true,
  fields: [],
  buttons: [],
  allowMentions: false
};

const TEMPLATES: { label: string; draft: Partial<Draft> }[] = [
  { label: tr('Bejelentés'), draft: { useEmbed: true, title: tr('📢 Bejelentés'), color: '#ff2d37', description: tr('Írd ide a bejelentés szövegét.'), footer: 'Avenge', timestamp: true } },
  { label: tr('Frissítés'), draft: { useEmbed: true, title: tr('🆕 Frissítés'), color: '#3ddc84', description: tr('**Újdonságok:**\n• \n• '), footer: 'avenge.hu/changelogs', timestamp: true, buttons: [{ label: tr('Részletek'), url: 'https://avenge.hu' }] } },
  { label: tr('Karbantartás'), draft: { useEmbed: true, title: tr('🛠️ Karbantartás'), color: '#f59e0b', description: tr('A szolgáltatás rövid ideig nem lesz elérhető.\n\n**Mikor:** \n**Várható időtartam:** '), footer: tr('Köszönjük a türelmet!'), timestamp: true } },
  { label: 'Plugin', draft: { useEmbed: true, title: '🔌 PC Check plugin', color: '#ff6a4d', description: tr('A PC Check Velocity-plugin befagyasztja a vizsgált játékost, külön chatet nyit a staffal, kódot kér, és Discordra naplózza az eredményt.'), buttons: [{ label: tr('Megvásárlom'), url: 'https://avenge.hu/store/avenge-ss' }] } }
];

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function markdown(text: string): string {
  return escapeHtml(text)
    .split('\n')
    .map((line) => {
      let out = line
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<u>$1</u>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/~~([^~]+)~~/g, '<s>$1</s>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
      if (/^#{1,3}\s/.test(out)) out = `<strong class="dc-heading">${out.replace(/^#{1,3}\s/, '')}</strong>`;
      else if (out.startsWith('&gt; ')) out = `<span class="dc-quote">${out.slice(5)}</span>`;
      return out;
    })
    .join('<br />');
}

function Rendered({ text, className }: { text: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: markdown(text) }} />;
}

export function DiscordComposer() {
  const [channels, setChannels] = useState<DiscordChannel[] | null>(null);
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ url: string; channel: string } | null>(null);

  const loadChannels = useCallback(() => {
    setError(null);
    discordAdminApi.channels().then(setChannels).catch((err) => setError(err instanceof ApiError ? err.message : tr('Nem sikerült lekérni a csatornákat.')));
  }, []);

  useEffect(() => { loadChannels(); }, [loadChannels]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      return;
    }
  }, [draft]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const groups = useMemo(() => {
    const map = new Map<string, DiscordChannel[]>();
    for (const c of channels ?? []) {
      const key = c.category ?? tr('Kategória nélkül');
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return [...map.entries()];
  }, [channels]);

  const channel = channels?.find((c) => c.id === draft.channelId) ?? null;
  const hasEmbed = draft.useEmbed && Boolean(draft.title.trim() || draft.description.trim() || draft.imageUrl.trim() || draft.fields.some((f) => f.name.trim() && f.value.trim()));
  const canSend = Boolean(channel) && (draft.content.trim().length > 0 || hasEmbed) && !busy;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!channel || !window.confirm(tr('Elküldöd az üzenetet a #{0} csatornába?{1}', channel.name, draft.allowMentions ? tr(' A pingek (@everyone, szerepkörök) is értesítenek.') : ''))) return;
    setBusy(true);
    setError(null);
    setSent(null);
    const body: DiscordSendRequest = {
      channelId: channel.id,
      content: draft.content.trim() || null,
      embed: hasEmbed
        ? {
            title: draft.title, description: draft.description, url: draft.url, color: draft.color, imageUrl: draft.imageUrl,
            thumbnailUrl: draft.thumbnailUrl, footer: draft.footer, timestamp: draft.timestamp, fields: draft.fields
          }
        : null,
      buttons: draft.buttons.filter((b) => b.label.trim() || b.url.trim()),
      allowMentions: draft.allowMentions
    };
    try {
      const result = await discordAdminApi.send(body);
      setSent({ url: result.url, channel: channel.name });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tr('Nem sikerült elküldeni.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card section-gap stagger-in" style={{ animationDelay: '120ms' }}>
      <div className="scans-head">
        <h2 className="card-title"><Icon name="message" size={18} />{' '}{tr('Üzenet küldése a bottal')}</h2>
        <div className="chip-row">
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" className="chip chip-dim" onClick={() => setDraft((d) => ({ ...d, ...t.draft }))}>{t.label}</button>
          ))}
          <button type="button" className="chip chip-dim" onClick={() => { setDraft({ ...EMPTY, channelId: draft.channelId }); setSent(null); }}>{tr('Új üzenet')}</button>
        </div>
      </div>
      <p className="muted small">{tr('Bármelyik csatornába írhatsz sima szöveget Discord-formázással (**félkövér**, *dőlt*, __aláhúzott__, ~~áthúzott~~, `kód`, > idézet, # címsor, [szöveg](link)), embedet színnel, mezőkkel és képpel, és link-gombokat. A pingek alapból ki vannak kapcsolva. A piszkozat ebben a böngészőben megmarad.')}</p>

      <form className="dc-composer" onSubmit={send}>
        <div className="dc-editor">
          <label>
            <span className="field-label">{tr('Csatorna')}</span>
            <div className="inline-form">
              <select value={draft.channelId} onChange={(e) => set('channelId', e.target.value)} required>
                <option value="">{tr('Válassz csatornát...')}</option>
                {groups.map(([category, list]) => (
                  <optgroup key={category} label={category}>
                    {list.map((c) => <option key={c.id} value={c.id}>{c.type === 5 ? '📢 ' : '# '}{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
              <button type="button" className="btn-ghost btn-tiny" onClick={loadChannels} title={tr('Csatornák frissítése')}><Icon name="refresh" size={13} /></button>
            </div>
          </label>

          <label>
            <span className="field-label">{tr('Szöveg (az embed fölött jelenik meg)')}</span>
            <textarea rows={4} maxLength={2000} value={draft.content} onChange={(e) => set('content', e.target.value)} placeholder={tr('Pl. @everyone Megjelent az új frissítés!')} />
          </label>

          <label className="consent-check">
            <input type="checkbox" checked={draft.useEmbed} onChange={(e) => set('useEmbed', e.target.checked)} />
            <span>{tr('Embed (keretes, színes üzenet)')}</span>
          </label>

          {draft.useEmbed && (
            <div className="dc-embed-form">
              <div className="dc-row">
                <label className="dc-grow">
                  <span className="field-label">{tr('Cím')}</span>
                  <input maxLength={256} value={draft.title} onChange={(e) => set('title', e.target.value)} />
                </label>
                <label>
                  <span className="field-label">{tr('Szín')}</span>
                  <span className="dc-color">
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(draft.color) ? draft.color : '#ff2d37'} onChange={(e) => set('color', e.target.value)} aria-label={tr('Szín')} />
                    <input className="mono" maxLength={7} value={draft.color} onChange={(e) => set('color', e.target.value)} />
                  </span>
                </label>
              </div>
              <label>
                <span className="field-label">{tr('A cím linkje (nem kötelező)')}</span>
                <input value={draft.url} onChange={(e) => set('url', e.target.value)} placeholder="https://avenge.hu" />
              </label>
              <label>
                <span className="field-label">{tr('Leírás')}</span>
                <textarea rows={6} maxLength={4096} value={draft.description} onChange={(e) => set('description', e.target.value)} />
              </label>

              <div className="dc-fields">
                <span className="field-label">{tr('Mezők')}</span>
                {draft.fields.map((f, i) => (
                  <div key={i} className="dc-field">
                    <input placeholder={tr('Név')} maxLength={256} value={f.name} onChange={(e) => set('fields', draft.fields.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <textarea placeholder={tr('Érték')} rows={2} maxLength={1024} value={f.value} onChange={(e) => set('fields', draft.fields.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
                    <label className="consent-check dc-inline">
                      <input type="checkbox" checked={f.inline} onChange={(e) => set('fields', draft.fields.map((x, j) => j === i ? { ...x, inline: e.target.checked } : x))} />
                      <span>{tr('egymás mellett')}</span>
                    </label>
                    <button type="button" className="icon-button" aria-label={tr('Mező törlése')} onClick={() => set('fields', draft.fields.filter((_, j) => j !== i))}><Icon name="x" size={14} /></button>
                  </div>
                ))}
                {draft.fields.length < 25 && (
                  <button type="button" className="btn-ghost btn-tiny" onClick={() => set('fields', [...draft.fields, { name: '', value: '', inline: false }])}><Icon name="plus" size={13} />{' '}{tr('Mező')}</button>
                )}
              </div>

              <div className="dc-row">
                <label className="dc-grow">
                  <span className="field-label">{tr('Nagy kép (link)')}</span>
                  <input value={draft.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
                </label>
                <label className="dc-grow">
                  <span className="field-label">{tr('Kis kép jobbra (link)')}</span>
                  <input value={draft.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} placeholder="https://avenge.hu/favicon-512.png" />
                </label>
              </div>
              <div className="dc-row">
                <label className="dc-grow">
                  <span className="field-label">{tr('Lábléc')}</span>
                  <input maxLength={2048} value={draft.footer} onChange={(e) => set('footer', e.target.value)} />
                </label>
                <label className="consent-check dc-inline">
                  <input type="checkbox" checked={draft.timestamp} onChange={(e) => set('timestamp', e.target.checked)} />
                  <span>{tr('időbélyeg')}</span>
                </label>
              </div>
            </div>
          )}

          <div className="dc-fields">
            <span className="field-label">{tr('Link-gombok (max. 5)')}</span>
            {draft.buttons.map((b, i) => (
              <div key={i} className="dc-field dc-button-row">
                <input placeholder={tr('Felirat')} maxLength={80} value={b.label} onChange={(e) => set('buttons', draft.buttons.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <input placeholder="https://..." value={b.url} onChange={(e) => set('buttons', draft.buttons.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
                <button type="button" className="icon-button" aria-label={tr('Gomb törlése')} onClick={() => set('buttons', draft.buttons.filter((_, j) => j !== i))}><Icon name="x" size={14} /></button>
              </div>
            ))}
            {draft.buttons.length < 5 && (
              <button type="button" className="btn-ghost btn-tiny" onClick={() => set('buttons', [...draft.buttons, { label: '', url: '' }])}><Icon name="plus" size={13} />{' '}{tr('Gomb')}</button>
            )}
          </div>

          <label className="consent-check">
            <input type="checkbox" checked={draft.allowMentions} onChange={(e) => set('allowMentions', e.target.checked)} />
            <span>{tr('Pingek engedélyezése (@everyone, @here, szerepkörök és felhasználók)')}</span>
          </label>

          <div className="dc-send">
            <button type="submit" className={`btn-primary ${busy ? 'is-loading' : ''}`} disabled={!canSend}>
              <Icon name="message" size={15} />{' '}{tr('Küldés')}{channel ? tr(' ide: #{0}', channel.name) : ''}
            </button>
            {sent && <a className="text-link small" href={sent.url} target="_blank" rel="noreferrer"><Icon name="check" size={13} />{' '}{tr('Elküldve a #')}{sent.channel}{' '}{tr('csatornába · megnyitás')}</a>}
          </div>
          {error && <p className="error-text error-in">{error}</p>}
        </div>

        <div className="dc-preview" aria-label={tr('Előnézet')}>
          <span className="field-label">{tr('Előnézet')}</span>
          <div className="dc-message">
            <div className="dc-avatar" aria-hidden="true">{tr('A')}</div>
            <div className="dc-body">
              <div className="dc-author"><strong>{tr('Avenge')}</strong> <span className="dc-bot">{tr('BOT')}</span> <small>{tr('ma')}</small></div>
              {draft.content.trim() && <Rendered className="dc-content" text={draft.content} />}
              {hasEmbed && (
                <div className="dc-embed" style={{ borderLeftColor: /^#[0-9a-f]{6}$/i.test(draft.color) ? draft.color : '#202225' }}>
                  <div className="dc-embed-main">
                    <div>
                      {draft.title.trim() && (draft.url.trim() ? <a className="dc-embed-title" href={draft.url} target="_blank" rel="noreferrer">{draft.title}</a> : <div className="dc-embed-title">{draft.title}</div>)}
                      {draft.description.trim() && <Rendered className="dc-embed-desc" text={draft.description} />}
                      {draft.fields.some((f) => f.name.trim() && f.value.trim()) && (
                        <div className="dc-embed-fields">
                          {draft.fields.filter((f) => f.name.trim() && f.value.trim()).map((f, i) => (
                            <div key={i} className={f.inline ? 'dc-embed-field is-inline' : 'dc-embed-field'}>
                              <strong>{f.name}</strong>
                              <Rendered text={f.value} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {draft.thumbnailUrl.trim() && <img className="dc-thumb" src={draft.thumbnailUrl} alt="" />}
                  </div>
                  {draft.imageUrl.trim() && <img className="dc-image" src={draft.imageUrl} alt="" />}
                  {(draft.footer.trim() || draft.timestamp) && (
                    <div className="dc-footer">{draft.footer.trim()}{draft.footer.trim() && draft.timestamp ? ' • ' : ''}{draft.timestamp ? 'ma' : ''}</div>
                  )}
                </div>
              )}
              {draft.buttons.some((b) => b.label.trim()) && (
                <div className="dc-buttons">
                  {draft.buttons.filter((b) => b.label.trim()).map((b, i) => <span key={i} className="dc-button">{b.label} <Icon name="external" size={12} /></span>)}
                </div>
              )}
              {!draft.content.trim() && !hasEmbed && <p className="muted small">{tr('Az üzenet itt jelenik meg, ahogy a Discordon látszani fog.')}</p>}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
