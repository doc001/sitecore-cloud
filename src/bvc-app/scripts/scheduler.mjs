import schedule from "node-schedule";
import { exec } from "child_process";

console.log("PM2 Scheduler started — will run every :15 past the hour.");

// Cron rule: At minute 15 of every hour
schedule.scheduleJob("15 * * * *", () => {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] Running npm script...`);

  exec("npm run build", (error, stdout, stderr) => {
    if (error) {
      console.error(`[${timestamp}] Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[${timestamp}] stderr: ${stderr}`);
    }
    if (stdout) {
      console.log(`[${timestamp}] stdout: ${stdout}`);
    }
  });
});