# BVC Solution

## PREREQUISITES
You must have the following software components on your workstation:

1. A valid Sitecore license file.

2. Windows PowerShell

3. The current long-term support (LTS) version of Node.js. Check your installed version with `node -v` https://nodejs.org/ (v18 as of project start)

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

1. In an *ADMIN* terminal, run:

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
1. In and *ADMIN* terminal, run:

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

The "default" environment is defined *<REPODIR>/.sitecore/user.json* this file does not sync with the repo and is unique for each developer. There are steps to add the XM Cloud environments to this file for direct connection situations.

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


# FRONT END
Please refer to the README.md under *<REPODIR>/src/bvcrendering* for the front end React/Next.JS and Storybook instructions.