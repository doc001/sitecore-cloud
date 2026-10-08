'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/_CareerAdvisor.module.css';
import AgentText from './AgentText';
import type { AdmissionChecklist } from '@/lib/careerAdvisor/agent';

export interface ChatMessage {
  from: 'user' | 'agent';
  text: string;
  /** PDFs the agent made with this reply, offered as download buttons */
  checklists?: AdmissionChecklist[];
}

/** jsPDF is only fetched when someone actually downloads a checklist. */
async function download(checklist: AdmissionChecklist) {
  const { downloadChecklist } = await import('@/lib/careerAdvisor/checklistPdf');
  downloadChecklist(checklist);
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2V11M8 11L4.5 7.5M8 11L11.5 7.5M3 14H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface AdvisorChatProps {
  messages: ChatMessage[];
  busy: boolean;
  error: string | null;
  onSend: (text: string) => void;
}

const SUGGESTIONS = [
  'What do I need to get into the first program?',
  'Can you make me a checklist for getting into the first program?',
  'Which of these careers is most in demand?',
  'What does a typical day look like in the first career?',
];

export default function AdvisorChat({ messages, busy, error, onSend }: AdvisorChatProps) {
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view without scrolling the whole page
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, busy]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
    setDraft('');
  };

  return (
    <section aria-labelledby="ca-chat" className="space-y-4">
      <div>
        <h3 id="ca-chat" className={styles.sectionTitle}>Have questions? Ask the Career Advisor</h3>
        <p className={`${styles.muted} mt-1`}>
          Ask about admission requirements, what a job involves, or how these programs compare.
        </p>
      </div>

      {(messages.length > 0 || busy) && (
        <div ref={logRef} className={styles.chatLog} aria-live="polite" aria-busy={busy}>
          {messages.map((m, i) => (
            <div key={i} className={`${styles.bubble} ${m.from === 'user' ? styles.bubbleUser : styles.bubbleAgent}`}>
              <span className="sr-only">{m.from === 'user' ? 'You said: ' : 'Career Advisor: '}</span>
              {m.from === 'agent' ? <AgentText text={m.text} /> : m.text}
              {m.checklists?.map((c) => (
                <button
                  key={c.programTitle}
                  type="button"
                  onClick={() =>
                    void download(c).catch((err) => console.error('[career-advisor] checklist PDF failed:', err))
                  }
                  className={`${styles.btn} ${styles.btnPrimary} mt-3 w-full sm:w-auto`}
                >
                  <DownloadIcon />
                  Download PDF checklist: {c.programTitle}
                </button>
              ))}
            </div>
          ))}
          {busy && (
            <div className={`${styles.bubble} ${styles.bubbleAgent} inline-flex items-center gap-3`} role="status">
              <span className={`${styles.spinner} ${styles.spinnerSmall}`} aria-hidden="true" />
              Thinking…
            </div>
          )}
        </div>
      )}

      {error && (
        <p className={styles.notice} role="alert">{error}</p>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => submit(s)} className={`${styles.chip} cursor-pointer hover:bg-[var(--purple--100-tr-20)]`}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <label htmlFor="ca-chat-input" className="sr-only">Your question</label>
        <input
          id="ca-chat-input"
          type="text"
          className={styles.chatInput}
          placeholder="Type your question…"
          value={draft}
          maxLength={1000}
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" disabled={busy || draft.trim() === ''} className={`${styles.btn} ${styles.btnPrimary}`}>
          Send
        </button>
      </form>
      <p className="text-xs text-[color:var(--color-neutral-60)]">
        The Career Advisor is an AI assistant. It can make mistakes, so check details on the program and career pages it
        links to. Please don&apos;t share personal information.
      </p>
    </section>
  );
}
