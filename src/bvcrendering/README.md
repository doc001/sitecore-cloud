# BVC Sitecore JSS Next.JS Application

## PREREQUISITES
You must have the following software components on your workstation:

1. Windows PowerShell

2. Latest version of NVM https://github.com/coreybutler/nvm-windows#readme

3. The current long-term support (LTS) version of Node.js. Check your installed version with `node -v` https://nodejs.org/ (v18 as of project start)

4. Intall JSS CLI Global Install `npm install -g @sitecore-jss/sitecore-jss-cli`

## QUICK START - FIRST RUN/SETUP {#frist-run}
Change the working directory of your terminal to the _<REPOROOT>/src/bvcrendering_ directory.

1. Intall the solution

    ```ps1
    npm install
    ```

2. Run the solution

    ```ps1
    npm run start
    ```

3. Run Storybook

    ``` ps1
    npm run storybook
    ```

    The following commands are available for Storybook:
    - `storybook` runs Storybook and launches http://localhost:6006 
    - `build-storybook`
    - `generate-stories`


## QUICK START - ONGOING USE {#ongoing}
Change the working directory of your terminal to the _<REPOROOT>/src/bvcrendering_ directory.
1. Run the solution

    ```ps1
    cd bvcrendering

    npm run start
    ```

2. Run Storybook

    ``` ps1
    npm run storybook
    ```

    The following commands are available for Storybook:
    - `storybook` runs Storybook and launches http://localhost:6006 
    - `build-storybook`

***


# RESOURCES
+ [Documentation (Experience Platform)](https://doc.sitecore.com/xp/en/developers/hd/21/sitecore-headless-development/sitecore-javascript-rendering-sdk--jss--for-next-js.html)

+ [Documentation (XM Cloud)](https://doc.sitecore.com/xmc/en/developers/xm-cloud/sitecore-javascript-rendering-sdk--jss--for-next-js.html)

+ [Sitecore Search](https://developers.sitecorecloud.io/search-sdk/react/2.x/storybook/index.html?path=/docs/introduction-introduction--page)
