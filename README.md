# This Repo Reproduces an SQLITE_ERROR

with this repo the Error described in this [issue](https://github.com/electron-userland/electron-builder/issues/8824#issuecomment-2626105879) can be reproduced.

## Getting started

```sh
# pull the repo
cd reproduce-sql-error

npm install

# start development mode (this works fine)
npm run dev

# this creates the DMG & ZIP files for distribution (also runs w/o errors)
npm run package

# run app in production mode -> frontend works but no response from backend
npm run start
```

## Reproducing the Error

```sh
# Build and package the Electron app for macOS ARM64
npm run package

# Extract the packaged application from the zip file
unzip dist/ErrorDemo-0.0.0-arm64-mac.zip

# Launch the application from the command line to see error output
./ErrorDemo.app/Contents/MacOS/ErrorDemo

# Expected error output and explanation:
# Initial startup information
App ready event fired
Electron version: 30.5.1
Chrome version: 124.0.6367.243
Node version: 20.16.0

# Shows where the app is trying to store its database
Database path (this.dbPath): /Users/matsfunke/Library/Application Support/reproduce-sql-error/data/demo.db

# Main error: SQLite extension loading failure
# The error occurs because the native module (vec0.dylib) can't be loaded from the asar archive
Failed to create window: SqliteError: dlopen(/Users/matsfunke/dev/reproduce-sql-error/ErrorDemo.app/Contents/Resources/app.asar/node_modules/sqlite-vec-darwin-arm64/vec0.dylib.dylib, 0x000A): tried: '/Users/matsfunke/dev/reproduce-sql-error/ErrorDemo.app/Contents/Resources/app.asar/node_modules/sqlite-vec-darwin-arm64/vec0.dylib.dylib' (errno=20)...

# Error stack trace showing the sequence of calls that led to the failure:
# 1. Trying to load SQLite extension
    at Database.loadExtension (...wrappers.js:19:14)
# 2. sqlite-vec module attempting to load
    at Module.load (file:.../sqlite-vec/index.mjs:55:6)
# 3. DatabaseService constructor initialization
    at new DatabaseService (file:.../databaseService.js:21:19)
# 4. Window creation process
    at createWindow (file:.../main.js:33:21)
# 5. App initialization
    at initializeApp (file:.../main.js:56:15)
# 6. App event handler
    at App.<anonymous> (file:.../main.js:70:5)
    at App.emit (node:events:519:28) {
  code: 'SQLITE_ERROR'
}
```

`/Users/matsfunke/dev/reproduce-sql-error/ErrorDemo.app/Contents/Resources/app.asar/node_modules/sqlite-vec-darwin-arm64/vec0.dylib` exsits but electron tries to open `/Users/matsfunke/dev/reproduce-sql-error/ErrorDemo.app/Contents/Resources/app.asar/node_modules/sqlite-vec-darwin-arm64/vec0.dylib.dylib`, I have tried several approaches but can't alter this behaviour.


Any help would be greatly apprciated!!!
