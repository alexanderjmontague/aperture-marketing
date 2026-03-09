# Aperture Marketing

This repo is ready for a simple static deployment on Vercel without a build step.

## Vercel setup

- Framework preset: `Other`
- Root directory: `.`
- Build command: leave empty
- Output directory: `.`

The repo includes a [`vercel.json`](./vercel.json) that sets those defaults for CLI-driven deployments, serves the project from the repository root, and provides a local `vercel dev` command via Python's built-in static server.

## Deploy later

When you're ready to connect the project, use:

```sh
npx vercel
```

That creates a preview deployment and links the repo to a Vercel project if it is not linked yet.

For production later:

```sh
npx vercel --prod
```

## Notes

- `.vercel/` is ignored so local Vercel project state does not get committed.
- `.vercelignore` excludes local screenshots and Playwright artifacts from uploads.
