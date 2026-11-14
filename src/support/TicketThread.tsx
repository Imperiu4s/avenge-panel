import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import { attachmentUrl, type SupportAttachment, type SupportMessage } from '../api/support';
import { Icon } from '../components/Icon';
import { formatDateTime } from '../store/format';

const MAX_FILES = 3;
const MAX_BYTES = 4 * 1024 * 1024;

function AttachmentThumb({ attachment, staff }: { attachment: SupportAttachment; staff: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let created: string | null = null;
    attachmentUrl(attachment.id, staff)
      .then((u) => {
        created = u;
        if (alive) setUrl(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [attachment.id, staff]);

  if (failed) return <span className="ticket-attachment ticket-attachment-missing"><Icon name="file" size={14} /> {attachment.fileName}</span>;
  if (!url) return <span className="ticket-attachment ticket-attachment-loading" />;
  return (
    <a className="ticket-attachment" href={url} target="_blank" rel="noopener noreferrer" title={attachment.fileName}>
      <img src={url} alt={attachment.fileName} />
    </a>
  );
}

export function TicketMessages({ messages, staff }: { messages: SupportMessage[]; staff: boolean }) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  return (
    <div className="ticket-thread">
      {messages.map((m) => {
        if (m.authorType === 'system') {
          return <p key={m.id} className="ticket-system small muted"><Icon name="info" size={13} /> {m.body} · {formatDateTime(m.createdAt)}</p>;
        }
        const mine = staff ? m.authorType === 'staff' : m.authorType === 'customer';
        return (
          <article key={m.id} className={`ticket-msg ${mine ? 'ticket-msg-mine' : 'ticket-msg-other'} ticket-msg-${m.authorType}`}>
            <header className="ticket-msg-head">
              <strong>{m.authorType === 'staff' && !staff ? <><Icon name="shield" size={13} /> {m.authorName}</> : m.authorName}</strong>
              <span className="muted small">{formatDateTime(m.createdAt)}</span>
            </header>
            {m.body && <p className="ticket-msg-body">{m.body}</p>}
            {m.attachments.length > 0 && (
              <div className="ticket-attachments">
                {m.attachments.map((a) => <AttachmentThumb key={a.id} attachment={a} staff={staff} />)}
              </div>
            )}
          </article>
        );
      })}
      <div ref={end} />
    </div>
  );
}

export function TicketComposer({ onSend, placeholder, extra, busyLabel = 'Küldés' }: {
  onSend: (message: string, files: File[], closeAfter: boolean) => Promise<void>;
  placeholder: string;
  extra?: (send: (closeAfter: boolean) => void, busy: boolean) => ReactNode;
  busyLabel?: string;
}) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = '';
    const images = chosen.filter((f) => f.type.startsWith('image/'));
    if (images.length !== chosen.length) setError('Csak képet csatolhatsz.');
    else if (images.some((f) => f.size > MAX_BYTES)) setError('Egy kép legfeljebb 4 MB lehet.');
    else setError(null);
    setFiles((prev) => [...prev, ...images.filter((f) => f.size <= MAX_BYTES)].slice(0, MAX_FILES));
  }

  async function submit(closeAfter = false) {
    if (!message.trim() && files.length === 0) {
      setError('Írj üzenetet, vagy csatolj képet.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSend(message, files, closeAfter);
      setMessage('');
      setFiles([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült elküldeni.');
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <form className="ticket-composer" onSubmit={onSubmit}>
      <textarea
        rows={4}
        maxLength={5000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
      />
      {files.length > 0 && (
        <div className="ticket-files">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="chip chip-dim">
              <Icon name="file" size={12} /> {f.name}
              <button type="button" className="chip-remove" aria-label={`${f.name} eltávolítása`} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                <Icon name="x" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="ticket-composer-actions">
        <button type="button" className="btn-ghost btn-tiny" onClick={() => input.current?.click()} disabled={busy || files.length >= MAX_FILES}>
          <Icon name="upload" size={13} /> Kép csatolása
        </button>
        <span className="muted small ticket-composer-hint">Ctrl+Enter: küldés · max. {MAX_FILES} kép, egyenként 4 MB</span>
        {extra?.((closeAfter) => submit(closeAfter), busy)}
        <button type="submit" className={`btn-primary btn-tiny ${busy ? 'is-loading' : ''}`} disabled={busy}>
          <Icon name="arrow-right" size={13} /> {busyLabel}
        </button>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={pick} />
      {error && <p className="error-text error-in">{error}</p>}
    </form>
  );
}
