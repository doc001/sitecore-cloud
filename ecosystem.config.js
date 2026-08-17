module.exports = {
  apps: [
    {
      name: 'bvc-hourly-deploy',
      script: 'pipeline.mjs',
      // HOURLY = course data only. Open Studies + Extended Education JSON come
      // from Sitecore (synced with Thesis in the backend) and are the only things
      // that move hourly; the rest of the site is static by nature. This refreshes
      // that JSON, overlays it onto the last full build's output, and deploys —
      // no Webflow fetch, no next build.
      //
      // A FULL build + deploy (`node pipeline.mjs`) is triggered by the coursesDB
      // cascade, which is what changes programs, requirements and PDFs. Run one
      // manually after publishing a new program or slug change in Webflow —
      // program-requirements-index.json only picks those up on a full build.
      args: '--data-only',
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
