module.exports = {
  apps: [
    {
      name: 'bvc-hourly-deploy',
      script: 'pipeline.mjs',
      // The upstream SIS → Sitecore sync starts on the hour and finishes around
      // :06, so we start at :15 to read freshly-synced data. Build takes ~3.5 min
      // → done by :19 → deploy fires immediately after.
      //
      // SIX fields (leading '0' = second). A five-field '15 * * * *' matches on
      // every second of that minute, and PM2 fires ~1 s early: it started a run
      // at :49:59, then at :50:00 matched again, SIGINT-killed the in-flight run
      // and started a second one. Every hour, all night. Pinning the second stops it.
      cron_restart: '0 15 * * * *',
      autorestart: false,
      watch: false,
      out_file: 'logs/pipeline-out.log',
      error_file: 'logs/pipeline-error.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'bvc-fee-watch',
      script: 'sitecore-fee-watch.mjs',
      // Every 5 minutes (six fields, same reason as above). Read-only GraphQL
      // polls against Sitecore Edge — no build, no deploy, nothing written.
      //
      // Independent of the pipeline on purpose: it keeps reporting when the
      // hourly deploy is disabled, and it pins the upstream write to ~5 min
      // instead of the fee guard's 1 hour. That precision is what lets the SIS
      // team match a flip against their own job logs.
      cron_restart: '0 */5 * * * *',
      autorestart: false,
      watch: false,
      out_file: 'logs/fee-watch-out.log',
      error_file: 'logs/fee-watch-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
