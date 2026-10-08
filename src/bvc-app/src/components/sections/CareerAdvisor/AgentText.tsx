'use client';

import React from 'react';

/**
 * Renders a chat-mode reply from the Career Advisor agent.
 *
 * The agent writes light markdown: **bold**, [text](url), bare URLs, "-"/"•"
 * bullets, numbered lists, and citation markers ("[1]") with
 * their definitions ("[1]: https://... \"Title\"") at the end. Everything is
 * built as React elements — the reply is model output and is never injected as
 * HTML. Only https links are rendered as links.
 */

const REF_LINE = /^\[(\d+)\]:\s*(\S+)(?:\s+"([^"]*)")?\s*$/;
const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https:\/\/[^)\s]+)\)|\[(\d+)\]|(https:\/\/[^\s)]+)/g;

function inline(text: string, refs: Map<string, { url: string; title?: string }>, keyBase: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[1]) {
      out.push(<strong key={key}>{m[1]}</strong>);
    } else if (m[2]) {
      out.push(<a key={key} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
    } else if (m[4]) {
      const ref = refs.get(m[4]);
      out.push(
        ref ? (
          <sup key={key}>
            <a href={ref.url} target="_blank" rel="noopener noreferrer" title={ref.title}>[{m[4]}]</a>
          </sup>
        ) : (
          m[0]
        )
      );
    } else if (m[5]) {
      out.push(<a key={key} href={m[5]} target="_blank" rel="noopener noreferrer">{m[5]}</a>);
    }
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function AgentText({ text }: { text: string }) {
  const refs = new Map<string, { url: string; title?: string }>();
  const lines: string[] = [];
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const ref = line.trim().match(REF_LINE);
    if (ref && ref[2].startsWith('https://')) refs.set(ref[1], { url: ref[2], title: ref[3] });
    else lines.push(line);
  }

  // Group consecutive list items so they render as one list
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((item, i) => <li key={i}>{inline(item, refs, `l${blocks.length}-${i}`)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={blocks.length} className="list-decimal pl-5 space-y-1">{items}</ol>
      ) : (
        <ul key={blocks.length} className="list-disc pl-5 space-y-1">{items}</ul>
      )
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•])\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (line === '') continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    blocks.push(
      heading ? (
        <p key={blocks.length} className="font-semibold">{inline(heading[1], refs, `h${blocks.length}`)}</p>
      ) : (
        <p key={blocks.length}>{inline(line, refs, `p${blocks.length}`)}</p>
      )
    );
  }
  flush();

  return <div className="space-y-3">{blocks}</div>;
}
