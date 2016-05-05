###How to start:

  1. Install or update `node` and `npm`

    - Clear NPM's cache: `sudo npm cache clean -f`
    - Install a little helper called 'n': `sudo npm install -g n`
    - Install latest stable _NodeJS_ version: `sudo n stable`. Alternatively pick a specific version and install like this: `sudo n 0.8.20`

  2. Install latest _gulp_ version

    ```bash
    npm install gulpjs/gulp#4.0
    ```

  3. Add string in your `.bashrc` or launch in console:

    ```bash
    export PATH="./node_modules/.bin:$PATH"
    ```

  4. Install all packages: `npm install`

  5. Run building system

    - in development mode `gulp dev` or just for building: `gulp build`
    - in production mode `NODE_ENV=production gulp buildproduction`

  6. Run js tests

    - create a directory `work/tmp`
    - run `gulp lint`
