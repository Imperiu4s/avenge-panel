import { Fragment, type ReactNode } from 'react';

function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  if (trimmed.startsWith('#')) return trimmed;
  return null;
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*\s][^*]*)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      const src = match[3];
      nodes.push(/^https:\/\//i.test(src)
        ? <img key={key} src={src} alt={match[2]} loading="lazy" referrerPolicy="no-referrer" />
        : match[0]);
    } else if (match[4]) {
      const href = safeHref(match[6]);
      const external = href !== null && /^https?:/i.test(href);
      nodes.push(href
        ? <a key={key} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{inline(match[5], key)}</a>
        : match[5]);
    } else if (match[7]) {
      nodes.push(<strong key={key}>{inline(match[8], key)}</strong>);
    } else if (match[9]) {
      nodes.push(<code key={key}>{match[10]}</code>);
    } else if (match[11]) {
      nodes.push(<em key={key}>{inline(match[12], key)}</em>);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

export function Markdown({ source, className = '' }: { source: string; className?: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push(<pre key={key++}><code>{code.join('\n')}</code></pre>);
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(4, heading[1].length + 1);
      const content = inline(heading[2], `h${key}`);
      const id = heading[2].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      blocks.push(level === 2 ? <h2 key={key++} id={id}>{content}</h2> : level === 3 ? <h3 key={key++} id={id}>{content}</h3> : <h4 key={key++} id={id}>{content}</h4>);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push(<hr key={key++} />);
      i++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) quote.push(lines[i++].trim().replace(/^>\s?/, ''));
      blocks.push(<blockquote key={key++}>{inline(quote.join(' '), `q${key}`)}</blockquote>);
      continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      const header = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
      blocks.push(
        <div className="md-table" key={key++}>
          <table>
            <thead><tr>{header.map((cell, c) => <th key={c}>{inline(cell, `th${key}-${c}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{inline(cell, `td${key}-${r}-${c}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^([-*+])\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i].trim();
        const bullet = ordered ? /^\d+[.)]\s+(.*)$/.exec(current) : /^[-*+]\s+(.*)$/.exec(current);
        if (bullet) {
          items.push(bullet[1]);
          i++;
        } else if (current !== '' && items.length > 0 && /^\s{2,}/.test(lines[i])) {
          items[items.length - 1] += ' ' + current;
          i++;
        } else {
          break;
        }
      }
      const children = items.map((item, n) => <li key={n}>{inline(item, `li${key}-${n}`)}</li>);
      blocks.push(ordered ? <ol key={key++}>{children}</ol> : <ul key={key++}>{children}</ul>);
      continue;
    }

    const paragraph: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const current = lines[i].trim();
      if (current === '' || /^(#{1,4}\s|```|>|[-*+]\s|\d+[.)]\s|\||-{3,}$)/.test(current)) break;
      paragraph.push(current);
      i++;
    }
    blocks.push(
      <p key={key++}>
        {paragraph.map((part, n) => (
          <Fragment key={n}>{n > 0 && <br />}{inline(part, `p${key}-${n}`)}</Fragment>
        ))}
      </p>
    );
  }

  return <div className={`markdown ${className}`}>{blocks}</div>;
}
