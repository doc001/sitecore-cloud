module.exports = {
  apps: [
    {
      name: 'bvc-hourly-deploy',
      script: 'pipeline.mjs',
      // Build takes ~3.5 min. Starts at :50 → done by :54 → deploy fires immediately after.
      // Adjust if build time grows significantly.
      cron_restart: '50 * * * *',
      autorestart: false,
      watch: false,
      out_file: 'logs/pipeline-out.log',
      error_file: 'logs/pipeline-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
