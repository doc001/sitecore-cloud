'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from '@/styles/_CareerAdvisor.module.css';
import {
  QUESTIONS,
  buildAgentPayload,
  emptyAnswers,
  scoreAnswers,
  type PersonaResult,
  type QuizAnswers,
} from '@/lib/careerAdvisor/quiz';
import {
  AdvisorConversation,
  isAgentConfigured,
  parseAdvisorResult,
  type AdvisorResult,
  type ChatReply,
} from '@/lib/careerAdvisor/agent';
import AdvisorResults, { type AgentState } from './AdvisorResults';
import AdvisorChat, { type ChatMessage } from './AdvisorChat';

type View =
  | { kind: 'intro' }
  | { kind: 'question'; index: number }
  /** Quiz finished, waiting for Claude's picks */
  | { kind: 'matching' }
  | { kind: 'results' };

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const STORAGE_KEY = 'bvcCareerAdvisor';
/** Long enough to see the selection land before moving on. */
const ADVANCE_DELAY_MS = 320;
/** Status lines cycled while the matches load — a single static line reads as stuck. */
const MATCHING_STEPS = [
  'Reading your answers…',
  'Looking through Alberta careers…',
  'Checking job outlooks and wages…',
  'Matching Bow Valley College programs…',
  'Almost there…',
];
const MATCHING_STEP_MS = 4000;

/**
 * When the last browser back/forward happened. Inside the site, Back is handled
 * by Next's client router (a popstate, not a page load), so the navigation-timing
 * type alone can't tell "came back" from "fresh visit". Registered once, at
 * module load, so it also sees a popstate that fires while this page is unmounted.
 */
let lastPopstateAt = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    lastPopstateAt = Date.now();
  });
}

/** True when this mount came from the browser's Back/Forward button. */
function arrivedByBackForward(): boolean {
  if (Date.now() - lastPopstateAt < 3000) return true;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === 'back_forward' && new URL(nav.name).pathname === window.location.pathname;
}

interface Saved {
  answers: QuizAnswers;
  result: AdvisorResult | null;
}

function load(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    return Array.isArray(saved.answers) && saved.answers.length === QUESTIONS.length ? saved : null;
  } catch {
    return null;
  }
}

function save(value: Saved | null) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable (private browsing) — results just won't survive a reload
  }
}

/**
 * Recap that opens a NEW conversation from chat — when the quiz conversation is
 * gone (results restored after a reload, or the quiz request failed).
 */
function chatContext(persona: PersonaResult, result: AdvisorResult | null): string {
  const parts = [`I took BVC's career quiz. My result was ${persona.primary.name}, with strong ${persona.secondary.name} traits.`];
  if (result?.occupations.length) parts.push(`Suggested careers: ${result.occupations.map((o) => o.title).join(', ')}.`);
  if (result?.programs.length) parts.push(`Suggested programs: ${result.programs.map((p) => p.title).join(', ')}.`);
  return parts.join(' ');
}

export default function CareerAdvisorSection() {
  const [view, setView] = useState<View>({ kind: 'intro' });
  const [answers, setAnswers] = useState<QuizAnswers>(emptyAnswers);
  const [persona, setPersona] = useState<PersonaResult | null>(null);
  const [agent, setAgent] = useState<AgentState>({ status: 'loading' });
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const conversation = useRef<AdvisorConversation | null>(null);
  /** Ignore replies from a quiz run the visitor has since abandoned. */
  const runId = useRef(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigated = useRef(false);

  // Restore a finished quiz only when the visitor comes BACK to the page (browser
  // back/forward). A fresh visit or a reload always starts the quiz from the top.
  useEffect(() => {
    if (!arrivedByBackForward()) return;
    const saved = load();
    if (!saved) return;
    setAnswers(saved.answers);
    setPersona(scoreAnswers(saved.answers));
    setAgent(saved.result ? { status: 'done', result: saved.result } : isAgentConfigured() ? { status: 'error' } : { status: 'unconfigured' });
    setView({ kind: 'results' });
  }, []);

  // Move focus and scroll with each step — but not on first render
  useEffect(() => {
    if (!hasNavigated.current) return;
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const target = view.kind === 'results' ? document.getElementById('ca-results') : headingRef.current;
    target?.focus({ preventScroll: true });
  }, [view]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const go = (next: View) => {
    hasNavigated.current = true;
    setView(next);
  };

  /** Leave the waiting screen. A retry from the results page stays where it is. */
  const showResults = () => {
    hasNavigated.current = true;
    setView((v) => (v.kind === 'matching' ? { kind: 'results' } : v));
  };

  const askAgent = useCallback(async (finalAnswers: QuizAnswers, result: PersonaResult) => {
    const run = ++runId.current;
    conversation.current = null;
    if (!isAgentConfigured()) {
      // Set NEXT_PUBLIC_ANTHROPIC_API_KEY to call Claude, or feed a result in by
      // hand with careerAdvisor.showResult(...) — see the hook below.
      console.info(
        '[career-advisor] No API key configured. Quiz results that would be sent:\n' +
          JSON.stringify(buildAgentPayload(finalAnswers, result), null, 2)
      );
      setAgent({ status: 'unconfigured' });
      save({ answers: finalAnswers, result: null });
      showResults();
      return;
    }
    setAgent({ status: 'loading' });
    try {
      const conv = await AdvisorConversation.start();
      const reply = await conv.askQuiz(buildAgentPayload(finalAnswers, result));
      if (run !== runId.current) return;
      conversation.current = conv;
      setAgent({ status: 'done', result: reply });
      save({ answers: finalAnswers, result: reply });
      showResults();
    } catch (err) {
      if (run !== runId.current) return;
      console.error('[career-advisor] quiz request failed:', err);
      setAgent({ status: 'error' });
      save({ answers: finalAnswers, result: null });
      showResults();
    }
  }, []);

  const finish = (finalAnswers: QuizAnswers) => {
    const result = scoreAnswers(finalAnswers);
    setPersona(result);
    setChat([]);
    setChatError(null);
    go({ kind: 'matching' });
    void askAgent(finalAnswers, result);
  };

  const choose = (qi: number, oi: number) => {
    const next = [...answers];
    next[qi] = oi;
    setAnswers(next);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (qi === QUESTIONS.length - 1) finish(next);
      else go({ kind: 'question', index: qi + 1 });
    }, ADVANCE_DELAY_MS);
  };

  const retake = () => {
    runId.current++;
    conversation.current = null;
    save(null);
    setAnswers(emptyAnswers());
    setPersona(null);
    setChat([]);
    setChatError(null);
    go({ kind: 'question', index: 0 });
  };

  const sendChat = async (text: string) => {
    if (!persona) return;
    setChat((c) => [...c, { from: 'user', text }]);
    setChatBusy(true);
    setChatError(null);

    try {
      let reply: ChatReply;
      if (conversation.current) {
        reply = await conversation.current.askChat(text);
      } else {
        // A new conversation has not seen the quiz — recap it first
        const result = agent.status === 'done' ? agent.result : null;
        conversation.current = await AdvisorConversation.start();
        reply = await conversation.current.askChat(`${chatContext(persona, result)}\n\nMy question: ${text}`);
      }
      setChat((c) => [...c, { from: 'agent', text: reply.text, checklists: reply.checklists }]);
    } catch (err) {
      console.error('[career-advisor] chat request failed:', err);
      setChatError("Sorry, the Career Advisor couldn't answer just now. Please try again in a moment.");
    } finally {
      setChatBusy(false);
    }
  };

  /**
   * Dev-only console hook for testing the results view without an API call:
   *   careerAdvisor.showResult(<result>)
   * Accepts the result as an object or as pasted text (stray text around the
   * JSON and smart quotes are tolerated). Not registered in production builds.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const w = window as Window & { careerAdvisor?: { showResult: (reply: unknown) => AdvisorResult | null } };
    w.careerAdvisor = {
      showResult(reply) {
        if (!persona) {
          console.warn('[career-advisor] Finish the quiz first, then call showResult().');
          return null;
        }
        const parsed = parseAdvisorResult(typeof reply === 'string' ? reply : JSON.stringify(reply));
        if (!parsed) {
          console.warn('[career-advisor] That is not a usable agent reply: no JSON object with occupations, programs or message.');
          return null;
        }
        runId.current++; // drop any request still in flight
        setAgent({ status: 'done', result: parsed });
        save({ answers, result: parsed });
        console.info('[career-advisor] Showing pasted result:', parsed);
        return parsed;
      },
    };
    return () => {
      delete w.careerAdvisor;
    };
  }, [answers, persona]);

  // Keyboard shortcut: 1–5 picks an answer
  useEffect(() => {
    if (view.kind !== 'question') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= QUESTIONS[view.index].options.length) choose(view.index, n - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const answered = answers.filter((a) => a !== null).length;
  const progress =
    view.kind === 'results' || view.kind === 'matching' ? 100 : view.kind === 'question' ? Math.round((view.index / QUESTIONS.length) * 100) : 0;

  return (
    <div ref={rootRef} className="scroll-mt-24">
      <div className={styles.panel}>
        {view.kind !== 'intro' && (
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            style={{ borderRadius: 0 }}
          >
            <div className={styles.progressFill} style={{ width: `${progress}%`, borderRadius: 0 }} />
          </div>
        )}

        <div className={styles.panelBody}>
          {view.kind === 'intro' && (
            <div className="max-w-3xl space-y-6">
              <p className={styles.eyebrow}>Career Advisor</p>
              <h2 ref={headingRef} tabIndex={-1} className={`${styles.heading} text-3xl md:text-5xl outline-none`}>
                Which career fits how you think?
              </h2>
              <p className={styles.lede}>
                Answer eight quick questions about what motivates you, not what you think you&apos;re
                &ldquo;supposed&rdquo; to study. We&apos;ll match you with Alberta careers and the Bow Valley College
                programs that lead there.
              </p>
              <div className={styles.metaRow}>
                <span>8 questions</span>
                <span>About 2 minutes</span>
                <span>Real Alberta job data</span>
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => go({ kind: 'question', index: Math.max(0, answers.indexOf(null)) })}
              >
                {answered > 0 ? 'Continue the quiz' : 'Start the quiz'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          {view.kind === 'question' && (
            <div className="max-w-3xl space-y-6">
              <p className={styles.eyebrow}>
                Question {view.index + 1} of {QUESTIONS.length}
              </p>
              <h2
                id="ca-question"
                ref={headingRef}
                tabIndex={-1}
                className={`${styles.heading} text-2xl md:text-4xl outline-none`}
              >
                {QUESTIONS[view.index].question}
              </h2>
              <div className="space-y-3" role="group" aria-labelledby="ca-question">
                {QUESTIONS[view.index].options.map((opt, oi) => (
                  <button
                    key={opt.text}
                    type="button"
                    className={styles.option}
                    aria-pressed={answers[view.index] === oi}
                    onClick={() => choose(view.index, oi)}
                  >
                    <span className={styles.optionLetter} aria-hidden="true">{LETTERS[oi]}</span>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => go(view.index === 0 ? { kind: 'intro' } : { kind: 'question', index: view.index - 1 })}
                >
                  Back
                </button>
                <span className={`${styles.muted} hidden md:inline text-sm`}>Tip: press 1–5 to answer</span>
              </div>
            </div>
          )}

          {view.kind === 'matching' && (
            <MatchingView
              headingRef={headingRef}
              onBack={() => {
                runId.current++; // abandon the request in flight
                go({ kind: 'question', index: QUESTIONS.length - 1 });
              }}
            />
          )}

          {view.kind === 'results' && persona && (
            <div className="space-y-12">
              <AdvisorResults
                persona={persona}
                agent={agent}
                onRetry={() => void askAgent(answers, persona)}
                onRetake={retake}
              />
              {isAgentConfigured() && agent.status !== 'loading' && (
                <div className="border-t border-[color:var(--color-neutral-10)] pt-10">
                  <AdvisorChat messages={chat} busy={chatBusy} error={chatError} onSend={(t) => void sendChat(t)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shown between the last answer and the results while Claude picks matches. */
function MatchingView({
  headingRef,
  onBack,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, MATCHING_STEPS.length - 1)), MATCHING_STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 py-10 text-center">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.eyebrow}>Quiz complete</p>
      <h2 ref={headingRef} tabIndex={-1} className={`${styles.heading} text-2xl md:text-4xl outline-none`}>
        Finding careers that fit you
      </h2>
      <p className={styles.lede} role="status" aria-live="polite">
        {MATCHING_STEPS[step]}
      </p>
      <p className={styles.muted}>This can take up to a minute.</p>
      <button type="button" className={`${styles.btn} ${styles.btnText}`} onClick={onBack}>
        Go back and change my answers
      </button>
    </div>
  );
}
