/**
 * notify.mjs
 * ─────────────────────────────────────────────────────────────
 * Outbound alerting for the deploy pipeline.
 *
 * Two independent channels, because they cover different failures:
 *
 *   Teams  — says *what* broke. Fires only when the pipeline actually runs.
 *   Heartbeat — says *that* it ran. An external monitor raises the alarm when a
 *               ping fails to arrive, which is the only way to catch a machine
 *               that is asleep, a dead PM2 daemon, or a deleted cron. A local
 *               watchdog cannot do this: it dies with the machine it watches.
 *
 * Neither channel may ever fail a deploy — a monitoring outage must not become
 * an outage. Every function here swallows its own errors and returns a boolean.
 * ─────────────────────────────────────────────────────────────
 */

const TIMEOUT_MS = 10_000;

/**
 * Microsoft retired the O365 "connector" webhooks. Their replacement is a Power
 * Automate **Workflows** webhook, which rejects the old MessageCard shape and
 * expects an Adaptive Card in a message envelope. Pick the format from the host
 * so an existing connector URL keeps working if one is still in use.
 */
export function teamsPayload(url, title, message, isFailure = true) {
  const host = new URL(url).host;
  const isLegacyConnector = /(^|\.)(office|office365|outlook)\.com$/i.test(host);

  if (isLegacyConnector) {
    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      themeColor: isFailure ? 'FF0000' : '00C853',
      summary: title,
      title,
      text: message,
    };
  }

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: `${isFailure ? '🔴' : '🟢'} ${title}`,
              weight: 'Bolder',
              size: 'Medium',
              color: isFailure ? 'Attention' : 'Good',
              wrap: true,
            },
            { type: 'TextBlock', text: message, wrap: true },
            {
              type: 'FactSet',
              facts: [
                { title: 'Project', value: 'bvc-app' },
                { title: 'Host', value: process.env.COMPUTERNAME ?? 'unknown' },
                { title: 'Time', value: new Date().toLocaleString() },
              ],
            },
          ],
        },
      },
    ],
  };
}

/** POST an alert to Teams. No-ops when TEAMS_WEBHOOK_URL is unset. */
export async function sendTeams({ url, title, message, isFailure = true, log = console.warn }) {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsPayload(url, title, message, isFailure)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Workflows answers 202 with an empty body; legacy connectors answer 200 "1".
    if (!res.ok) {
      log(`Teams webhook returned HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    log(`Teams notification failed: ${err.message}`);
    return false;
  }
}

/**
 * Ping the external monitor (healthchecks.io or compatible).
 *   ''        run finished successfully
 *   '/start'  run began — lets the monitor measure duration and spot hangs
 *   '/fail'   run failed or was blocked
 */
export async function pingHeartbeat({ baseUrl, suffix = '', log = console.warn }) {
  if (!baseUrl) return false;
  try {
    const res = await fetch(baseUrl.replace(/\/$/, '') + suffix, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      log(`Heartbeat "${suffix || 'success'}" returned HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    log(`Heartbeat ping "${suffix || 'success'}" failed: ${err.message}`);
    return false;
  }
}
