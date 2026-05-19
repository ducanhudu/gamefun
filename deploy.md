# Deployment notes

## To Cloudflare Pages

Background music is stored in `browser/public/audio/`, so it is copied into
the build output automatically.

Recommended Cloudflare Pages settings for this repo:

- Framework preset: `None`
- Root directory: `browser`
- Build command: `node ../.yarn/releases/yarn-4.14.1.cjs build`
- Build output directory: `dist`

Alternative if you prefer building from the repo root:

- Root directory: `/`
- Build command:

  ```
  node .yarn/releases/yarn-4.14.1.cjs workspace @kenrick95/c4-browser build
  ```

- Build output directory: `browser/dist`

## To npm

Publishing [@kenrick95/c4](https://www.npmjs.com/package/@kenrick95/c4)

NOTE:

0. Check for package.json fields error

   ```
   yarn workspace @kenrick95/c4 check-package-json
   ```

1. Bump version

   ```
   yarn workspace @kenrick95/c4 version <major|minor|patch>
   ```
2. Commit + tag
    ```
    git commit -m "vx.x.x"
    git tag vx.x.x
    ```
3. Publish to npm
   ```
   yarn workspace @kenrick95/c4 npm publish
   ```
