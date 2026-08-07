# BVC Solution

## PREREQUISITES
You must have the following software components on your workstation:

1. A valid Sitecore license file.

2. Windows PowerShell

3. **Node.js v22 LTS** (includes npm — no separate npm install needed). Check your installed version with `node -v` and `npm -v`. Download from https://nodejs.org/

    - If Node is not installed, download the v22 LTS installer from https://nodejs.org/ and run it. npm is bundled automatically.

    - If you manage multiple Node versions with **nvm**:

    ```ps1
    nvm install 22
    nvm use 22
    ```

    To switch between versions for other projects: `nvm use <VERSION>`
    
4. .NET Core 6.0 SDK (check your installed version with the `dotnet --version` command). https://dotnet.microsoft.com/en-us/download/dotnet/6.0

5. Visual Studio 2022. https://visualstudio.microsoft.com/downloads/

6. Docker for Windows, with Windows Containers enabled. https://docs.docker.com/docker-for-windows/install/ (Version 4.18)

7. Any required components for using Sitecore Containers. https://doc.sitecore.com/xmc/en/developers/xm-cloud/preparing-to-run-the-xm-cloud-foundation-template-locally.html

### PREP BEFORE FIRST RUN

Before starting the containers, you must ensure the necessary ports are accessible.

To prepare the environment for running the solution:

Open PowerShell with administrator privileges.

Check if you have the Internet Information Server (IIS) running on port 443:
`Get-Process -Id (Get-NetTCPConnection -LocalPort 443).OwningProcess`

If you do, you must stop it:
`iisreset /stop`

Check if you have Apache Solr or any other service running on port 8984:
`Get-Process -Id (Get-NetTCPConnection -LocalPort 8984).OwningProcess`

If you do, you must stop it:
`Stop-Service -Name "<the name of your service>"`

Alternatively, if you have started it with Non-Sucking Service Manager, stop it with the following command:
`nssm stop "<the name of your service>"`


## QUICK START - FIRST RUN/SETUP  {#frist-run}
These steps for the first run/setup of the solution on your local development environment. If you have already run these steps, please proceed to [QUICK START - ONGOING USE](#ongoing)

1. In an _ADMIN_ terminal, run:

    ```ps1
    .\init.ps1 -InitEnv -LicenseXmlPath "C:\<PATHTOLICENSE>\license.xml" -AdminPassword "<DESIREDADMINPASSWORD>"
    ```

    This sets your admin password for your local instance and tells it where to find the license file during each run.

    There will be a notice at the bottom of the terminal window. For the first run it is recommended to perform the command they provide to register the certificate with your local machine to avoid any HTTPS errors when running the instance.

2. Restart your terminal and run:

    ```ps1
    .\up.ps1
    ```
    When prompted, in your browser, log in to the Sitecore XM instance and accept the device authorization.
    If you are a member of multiple organizations, select the organization for the current project.
    Wait for the startup script to open browser tabs for the rendered site and the Sitecore Launchpad.

3. When finsihed, Shutdown docker instance:

    ```ps1
    .\down.ps1
    ```


## QUICK START - ONGOING USE {#ongoing}
1. In and _ADMIN_ terminal, run:

    ```ps1
    .\up.ps1
    ```

2. When finsihed, Shutdown docker instance:

    ```ps1
    .\down.ps1
    ```

> :warning: **Important**
> 
> If you have to reset the state of your containers, you can run the \docker\clean.ps1 script. It clears all mounted data and the deployed/copied build output. After running the .\docker\clean.ps1 script, you must rebuild search indexes.


# SERIALIZATION
Item serialization CLI options below.

The "default" environment is defined _<REPODIR>/.sitecore/user.json_ this file does not sync with the repo and is unique for each developer. There are steps to add the XM Cloud environments to this file for direct connection situations.

## PULL Serialize changes from the "default" environment (local docker)
When you make changes on your local to the base items to sync back to the repo
```ps1
dotnet sitecore ser pull --environment-name default
```

## PUSH Serialize changes from the repo to "default" environment (local docker)
When new changes come in from the repo and need to be sync'ed into your local env
```ps1
dotnet sitecore ser push --environment-name default
```

## CONNECT XM Cloud TO YOUR LOCAL FOR SERIALIZATION (Not Required)
1. Go into the [XM Cloud portal](https://portal.sitecorecloud.io) and proceed to the **Project** -> **_Development_** -> **Details** section and pull the **Environment ID** value

2. In Terminal run `dotnet sitecore clou environment connect --allow-write -id <ENVIRONMENTID>`

3. This will connect the Development environment to your local instance and create a new record in the _user.json_ file. If you want to connect the other environments - not recommended - follow the same steps above, but instead of _Development_ load the others.

4. The pull and push serialize insturctions above will be used the same for XM Cloud, just change the `--environment-name` to match your target synced with the _user.json_ file.


# CHANGE _Pages_ EDITOR TO WORK LOCALLY
1. In your browser, navigate to the [XM Cloud Pages application](https://pages.sitecorecloud.io/).

2. Open the developer tools console of your browser and find the local storage section. The location differs between browsers:

    - For Chrome and Edge, open the **Application** panel. In the **Storage** section, expand the Local Storage section.

    - For Firefox, open the **Storage** panel, and expand the **Local Storage** section.

3. In the Local Storage panel, click the entry for XM Cloud Pages https://pages.sitecorecloud.io to reveal the local storage entries.

4. Create a new entry by adding a new row with the following values:

    - Key: **Sitecore.Pages.LocalXmCloudUrl**.

    - Value: the URL of your local XM Cloud instance. For example, https://xmcloudcm.localhost/.

5. Verify that your local XM Cloud instance is configured to connect with XM Cloud Pages. If correctly configured, your XM Cloud instance has the following environment variables:

    ```
    SITECORE_Pages_Client_Host=https://pages.sitecorecloud.io
    SITECORE_Pages_CORS_Allowed_Origins=pages.sitecorecloud.io
    SITECORE_GRAPHQL_CORS=*.sitecorecloud.io
    ```

6. Refresh the https://pages.sitecorecloud.io page to see your local front-end application.

> **Note**
> If you get a _401_ error, click **Home** and log in again if prompted.


# INSTALL DEPENDENCIES

Run **once from the repo root** — npm workspaces installs dependencies for all packages (`src/bvc-app`, `src/nextjs-jamstack`) in a single command:

```powershell
npm install
```

Do **not** run `npm install` inside individual app folders — the root install covers everything.

---

# ENVIRONMENT SETUP

Environment files are **gitignored** — they are never committed to the repo. Each developer must create them locally. The actual values (API keys, endpoints, credentials) are stored in the team's **local OneNote notebook**.

## `src/bvc-app/.env.local`

```
WEBFLOW_API_KEY=...
SITECORE_GRAPHQL_ENDPOINT=...
SITECORE_GRAPHQL_API_KEY=...
SC_APIKEY=...
SITECORE_USERNAME=...
SITECORE_PASSWORD=...
# Optional: Teams incoming webhook URL for pipeline failure alerts
TEAMS_WEBHOOK_URL=
```

## `src/nextjs-jamstack/.env.local`

```
SITECORE_GRAPHQL_ENDPOINT=...
SITECORE_GRAPHQL_API_KEY=...
```

> **Note:** Root `.env.template` covers Sitecore Docker/XM Cloud variables for local CM development. It is not required for frontend-only work.

---

# VERCEL DEPLOYMENT (bvc-app)

The `bvc-app` Next.js application deploys to Vercel under the `bvc-marketing-its` team scope.

## Vercel Projects

| Project | URL | Purpose |
|---|---|---|
| `bvc-thesis` | https://bvc-app-uat.vercel.app | **Production** — sole deployment target; all Webflow embeds load CSS/JS/data from here |

**Vercel is a static host only.** The site is built locally; the pre-built `out/` folder is packaged and uploaded directly using `vercel deploy --prebuilt`. Vercel never runs a build on its servers.

## Deploying

All deployments target `bvc-thesis`. Run on demand from the repo root:

```powershell
npm run deploy:bvcapp   # runs the full pipeline: build → package → deploy → cleanup
# or equivalently:
node pipeline.mjs
```

## Webflow Embed Asset URLs

All Webflow embeds (course listings, course detail pages) load assets and data from `bvc-app-uat.vercel.app`:

```html
<link rel="stylesheet" href="https://bvc-app-uat.vercel.app/css/os-course.css" />
<script src="https://bvc-app-uat.vercel.app/js/os-course.js" defer></script>
<script src="https://bvc-app-uat.vercel.app/js/ee-course.js" defer></script>
<script src="https://bvc-app-uat.vercel.app/js/checkout.js" defer></script>
```

---

# HOURLY AUTOMATED PIPELINE (PM2)

`pipeline.mjs` runs a full data refresh and deploys to `bvc-thesis` every hour at `:55`. It uses PM2 as a process manager and fires a Windows toast notification on failure.

## Pipeline steps (~5 min total)

| Step | What happens |
|---|---|
| Build | `npm run build:bvcapp --force` — fetches data from Webflow + Sitecore XMC, generates breadcrumbs, runs Next.js static export → `out/` |
| Package | Copies `out/` into `.vercel/output/static/` with a `config.json` (Vercel Build Output API v3) |
| Link project | `vercel pull` — refreshes `.vercel/project.json` for `bvc-thesis` |
| Deploy | `vercel deploy --prebuilt` — uploads static files; Vercel does not rebuild |
| Cleanup | Removes intermediate JSON files from `src/data/` |

## PM2 setup (run once)

> **Windows machine** — `pm2 startup` does not work on Windows. Use `pm2-windows-startup` instead to auto-start PM2 on login.

```powershell
npm install -g pm2
pm2 start ecosystem.config.js       # registers the cron (fires at :50 every hour)
pm2 save                            # save process list to ~/.pm2/dump.pm2

# Auto-start on Windows login:
npm install -g pm2-windows-startup
pm2-startup install
```

## PM2 day-to-day

```bash
pm2 status                      # check schedule and last run status
pm2 logs bvc-hourly-deploy      # live log tail
pm2 restart bvc-hourly-deploy   # trigger an immediate run right now
pm2 stop bvc-hourly-deploy      # pause the schedule
```

## Manual one-off run

```bash
node pipeline.mjs
```

Logs are written to `logs/` (git-ignored). To adjust the cron offset, edit `cron_restart` in `ecosystem.config.js`.

---

# FRONT END
Please refer to the README.md under _<REPODIR>/src/bvcrendering_ for the front end React/Next.JS and Storybook instructions.