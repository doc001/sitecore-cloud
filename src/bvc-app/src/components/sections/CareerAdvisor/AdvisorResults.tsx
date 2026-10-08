'use client';

import React from 'react';
import styles from '@/styles/_CareerAdvisor.module.css';
import type { PersonaResult } from '@/lib/careerAdvisor/quiz';
import type { AdvisorOccupation, AdvisorProgram, AdvisorResult } from '@/lib/careerAdvisor/agent';

export type AgentState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'done'; result: AdvisorResult }
  | { status: 'error' };

interface AdvisorResultsProps {
  persona: PersonaResult;
  agent: AgentState;
  onRetry: () => void;
  onRetake: () => void;
}

const WELCOME_CENTRE_URL = 'https://www.bowvalleycollege.ca/about-us/contact-us/welcome-centre';
const ALIS_URL = 'https://alis.alberta.ca/occinfo/occupations-in-alberta/';

/** Alberta 3-year forecast ratings, as alis defines them. */
const OUTLOOK: Record<string, { color: string; meaning: string }> = {
  hot: { color: 'var(--color-red-100)', meaning: 'Far more jobs than jobseekers' },
  warm: { color: 'var(--color-orange-100)', meaning: 'More jobs than jobseekers' },
  balanced: { color: 'var(--color-purple-100)', meaning: 'About enough jobseekers for the jobs' },
  cool: { color: 'var(--color-blue-100)', meaning: 'Fewer jobs than jobseekers' },
  cold: { color: 'var(--color-navy-100)', meaning: 'Far fewer jobs than jobseekers' },
};

function ExternalArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3V13M8 13L4 9M8 13L12 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** In-page anchor for a program card, so career cards can link down to it. */
const programAnchor = (title: string) =>
  `ca-program-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

/**
 * Scroll to a program card and flash it, so it's obvious which card the link
 * meant. The href still works on its own if this never runs.
 */
function jumpToProgram(event: React.MouseEvent<HTMLAnchorElement>, title: string) {
  const target = document.getElementById(programAnchor(title));
  if (!target) return;
  event.preventDefault();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  target.focus({ preventScroll: true });
  target.classList.remove(styles.cardHighlight);
  void target.offsetWidth; // restart the animation on a repeat click
  target.classList.add(styles.cardHighlight);
  window.setTimeout(() => target.classList.remove(styles.cardHighlight), 2400);
}

function OccupationCard({ occupation }: { occupation: AdvisorOccupation }) {
  const outlook = occupation.outlook ? OUTLOOK[occupation.outlook.toLowerCase()] : undefined;
  const facts: [string, React.ReactNode][] = [];
  if (occupation.outlook) {
    facts.push([
      'Job outlook',
      <span
        key="o"
        className={styles.outlook}
        style={{ '--outlook-color': outlook?.color } as React.CSSProperties}
        title={outlook ? `${outlook.meaning} (Alberta 3-year forecast)` : undefined}
      >
        {occupation.outlook}
        {outlook && <span className="sr-only"> — {outlook.meaning}</span>}
      </span>,
    ]);
  }
  if (occupation.averageWage) facts.push(['Average wage', occupation.averageWage]);
  if (occupation.minimumEducation) facts.push(['Education', occupation.minimumEducation]);
  if (occupation.certification) facts.push(['Certification', occupation.certification]);

  return (
    <article className={styles.card}>
      <h4 className={styles.cardTitle}>{occupation.title}</h4>
      {occupation.description && <p className="text-[color:var(--color-neutral-70)]">{occupation.description}</p>}
      {facts.length > 0 && (
        <dl className={styles.factList}>
          {facts.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
      {occupation.whyItFits && (
        <p className={styles.why}>
          <strong>Why it fits: </strong>
          {occupation.whyItFits}
        </p>
      )}
      {occupation.programs.length > 0 && (
        <div className="mt-auto flex flex-col gap-1">
          <p className="text-sm text-[color:var(--color-neutral-70)]">
            <strong>{occupation.programs.length === 1 ? 'Related BVC program:' : 'Related BVC programs:'}</strong>
          </p>
          {occupation.programs.map((title) => (
            <a
              key={title}
              href={`#${programAnchor(title)}`}
              onClick={(e) => jumpToProgram(e, title)}
              className={`${styles.link} inline-flex items-center gap-1`}
            >
              {title} <DownArrow />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function ProgramCard({ program }: { program: AdvisorProgram }) {
  return (
    <article id={programAnchor(program.title)} tabIndex={-1} className={`${styles.card} scroll-mt-28 outline-none`}>
      {program.credential && <p className={styles.eyebrow}>{program.credential}</p>}
      <h4 className={styles.cardTitle}>{program.title}</h4>
      {program.description && <p className="text-[color:var(--color-neutral-70)]">{program.description}</p>}
      {program.whyItFits && (
        <p className={styles.why}>
          <strong>Why it fits: </strong>
          {program.whyItFits}
        </p>
      )}
      {program.occupations.length > 0 && (
        <p className="text-sm text-[color:var(--color-neutral-70)]">
          <strong>Leads to: </strong>
          {program.occupations.join(', ')}
        </p>
      )}
      {program.url && (
        <a href={program.url} target="_blank" rel="noopener noreferrer" className={`${styles.link} mt-auto inline-flex items-center gap-1`}>
          View program <ExternalArrow />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </article>
  );
}

/** The persona's own program list — shown when the agent has nothing for us. */
function FallbackPrograms({ persona }: { persona: PersonaResult }) {
  return (
    <section aria-labelledby="ca-fallback-programs" className="space-y-4">
      <h3 id="ca-fallback-programs" className={styles.sectionTitle}>
        Programs you might like
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {persona.primary.programs.map((p) => (
          <li key={p.url}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.option} justify-between font-medium`}
            >
              {p.title}
              <ExternalArrow />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AdvisorResults({ persona, agent, onRetry, onRetake }: AdvisorResultsProps) {
  const result = agent.status === 'done' ? agent.result : null;
  const hasMatches = !!result && (result.occupations.length > 0 || result.programs.length > 0);

  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <p className={styles.eyebrow}>Career Advisor</p>
        <h2 id="ca-results" tabIndex={-1} className={`${styles.heading} text-3xl md:text-5xl outline-none`}>
          Your career suggestions
        </h2>
      </div>

      {/* Agent matches */}
      {agent.status === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <p className={`${styles.heading} text-xl`}>Finding Alberta careers that fit you…</p>
          <p className={styles.muted}>We&apos;re checking job outlooks, wages and Bow Valley College programs. This can take up to a minute.</p>
        </div>
      )}

      {hasMatches && (
        <>
          {result!.occupations.length > 0 && (
            <section aria-labelledby="ca-careers" className="space-y-5">
              <h3 id="ca-careers" className={styles.sectionTitle}>Alberta careers that fit you:</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {result!.occupations.map((o) => (
                  <OccupationCard key={o.title} occupation={o} />
                ))}
              </div>
              <p className="text-xs text-[color:var(--color-neutral-60)]">
                Career information © {new Date().getFullYear()} Government of Alberta. Reproduced with permission from{' '}
                <a href={ALIS_URL} target="_blank" rel="noopener noreferrer" className="underline">alis</a>. Wages and job
                outlooks cover a whole occupational group and are not a promise of a job or salary.
              </p>
            </section>
          )}

          {result!.programs.length > 0 && (
            <section aria-labelledby="ca-programs" className="space-y-5">
              <h3 id="ca-programs" className={styles.sectionTitle}>Bow Valley College programs to explore:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {result!.programs.map((p) => (
                  <ProgramCard key={p.title} program={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* No matches: agent unavailable, failed, or had nothing to say */}
      {(agent.status === 'error' || agent.status === 'unconfigured' || (agent.status === 'done' && !hasMatches)) && (
        <div className="space-y-6">
          {agent.status === 'error' && (
            <div className={styles.notice} role="alert">
              <p className="font-semibold">We couldn&apos;t load your career matches right now.</p>
              <p className="mt-1">
                No worries, your result is saved. You can try again, or start with the programs below.
              </p>
              <button type="button" onClick={onRetry} className={`${styles.btn} ${styles.btnText} mt-2`}>
                Try again
              </button>
            </div>
          )}
          {agent.status === 'done' && result?.message && <p className={styles.lede}>{result.message}</p>}
          <FallbackPrograms persona={persona} />
        </div>
      )}

      {/* Next steps */}
      <section aria-label="Next steps" className="flex flex-wrap gap-3 border-t border-[color:var(--color-neutral-10)] pt-8">
        <button type="button" onClick={onRetake} className={`${styles.btn} ${styles.btnSecondary}`}>
          Take the quiz again
        </button>
        <a href={WELCOME_CENTRE_URL} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnSecondary}`}>
          Talk to the Welcome Centre
        </a>
      </section>
    </div>
  );
}
