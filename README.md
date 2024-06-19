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


## QUICK START

1. In an ADMIN terminal:

    ```ps1
    .\init.ps1 -InitEnv -LicenseXmlPath "C:\<PATHTOLICENSE>\license.xml" -AdminPassword "<DESIREDADMINPASSWORD>"
    ```

2. Restart your terminal and run:

    ```ps1
    .\up.ps1
    ```

3. Follow the instructions to [deploy to XM Cloud](#deploy-to-xmcloud)

4. Create Edge token and [query from edge](#query-edge)

*** 

## About this Solution
This solution is designed to help developers learn and get started quickly
with XMCLoud + SXA.


## Pull Serialize changes from the "default" environment (local)
dotnet sitecore ser pull --environment-name default

