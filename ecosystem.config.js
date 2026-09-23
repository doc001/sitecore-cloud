module.exports = {
  apps: [
    {
      name: 'bvc-hourly-deploy',
      script: 'pipeline.mjs',
      // HOURLY = course data only. Open Studies + Extended Education JSON come
      // from Sitecore (synced with Thesis in the backend) and are the only things
      // that move hourly; the rest of the site is static by nature. --data-only
      // refreshes that JSON, overlays it onto the last full build's output, and
      // deploys — no Webflow fetch, no next build.
      //
      // A FULL build + deploy (`node pipeline.mjs`) is triggered by the coursesDB
      // cascade, which is what changes programs, requirements and PDFs. Run one
      // manually after publishing a new program or slug change in Webflow —
      // program-requirements-index.json only picks those up on a full build.
      args: '--data-only',
      // The upstream SIS → Sitecore sync starts on the hour and finishes around
      // :06, so we start at :15 to read freshly-synced data (the exact data this
      // --data-only job pulls).
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
    {
      name: 'bvc-sis-health',
      script: 'sis-health-watch.mjs',
      // Every 5 minutes, offset to :02/:07/:12… so it never starts in the same
      // second as bvc-fee-watch and the two cannot contend for the runner.
      //
      // This is the highest-severity watcher of the three. The fee watch reports
      // wrong PRICES; this one reports a cart that cannot take an order at all.
      // It probes the live SiS API (courseofferings, validation, fee) through the
      // production proxy and alerts on LATENCY, because that backend fails by
      // answering late rather than by answering wrong — 15 identical requests on
      // 2026-08-18 ranged 2.8 s to 90.3 s and every one returned HTTP 200.
      //
      // Read-only: no cart is created, no registration submitted.
      cron_restart: '0 2-59/5 * * * *',
      autorestart: false,
      watch: false,
      out_file: 'logs/sis-health-out.log',
      error_file: 'logs/sis-health-error.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'bvc-log-archive',
      script: 'archive-logs.mjs',
      // Daily at 03:30. Moves every COMPLETE day out of logs/ and into
      // OneDrive under <ISO week>/<day>/, leaving only today local.
      //
      // Why it must leave this machine: logs/ is append-only and nothing prunes
      // it — pipeline-out.log alone grows ~2 MB/day — but the real reason is that
      // every log this project produces lives on ONE laptop. The SiS timings the
      // SiS team is asked to act on die with it. OneDrive is backed up.
      //
      // 03:30 is the quietest slot: bvc-fee-watch fires on minutes divisible by 5,
      // bvc-sis-health on :02/:07/:12…, and bvc-hourly-deploy at :15. Nothing
      // starts at :30, so the truncate does not race a poll mid-write.
      //
      // SIX fields (leading 0 = second), for the same reason as every cron above:
      // a five-field '30 3 * * *' matches on every second of that minute.
      cron_restart: '0 30 3 * * *',
      autorestart: false,
      watch: false,
      out_file: 'logs/log-archive-out.log',
      error_file: 'logs/log-archive-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
