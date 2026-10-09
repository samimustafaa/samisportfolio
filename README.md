# Sami Mustafa — Portfolio

A fast, responsive portfolio for Sami Mustafa, front end developer and instructor based in North Macedonia.

[View the website](https://sami-portfolio-studio.samimustafa072.chatgpt.site) · [GitHub](https://github.com/samimustafaa) · [Contact](mailto:samimustafa072@gmail.com)

## Features

- Nine selected projects with animated hover previews and touch-friendly controls.
- Interactive name typography, portrait tilt, and subtle motion effects.
- Real technology icons, including C#, Python, and TypeScript.
- A latest-commit card with repository visibility, branch, commit ID, committer, date, time, avatar, and real additions/deletions when available.
- Authorized private repository activity, with all GitHub credentials kept on the server.
- Automatic commit syncing every 30 seconds while the tab is visible.
- Early commit fetching, per-tab response restoration, background server refreshes, and versioned asset caching.
- Reduced-motion support, keyboard navigation, and locally hosted fonts.

## Stack

HTML, CSS, and vanilla JavaScript for the frontend; an ES module Worker for the GitHub API and static assets. The build has no third-party npm dependencies.

## Getting started

Requires Node.js 22 or newer.

```sh
git clone https://github.com/samimustafaa/samisportfolio.git
cd samisportfolio
npm run build
npm test
```

The build writes `dist/server/index.js`. Deploy this file with a compatible Worker host. Serving `dist/` as static files previews the frontend, but live commit syncing requires the Worker endpoint `/api/github/commits`.

## GitHub configuration

Set these variables in your host's runtime settings:

| Variable | Purpose |
| --- | --- |
| `GITHUB_USERNAME` | GitHub username; defaults to `samimustafaa`. |
| `GITHUB_TOKEN` | Server-side secret with read access to the repositories to include. |

For private activity, authorize the token to read the relevant private repositories. Never put the token in frontend code or commit it to Git. `.env.example` contains variable names only; the Worker reads runtime bindings rather than loading that file itself.

## Project structure

```text
dist/          Frontend HTML, CSS, JavaScript, fonts, and assets
worker/        Server-side GitHub feed and asset serving
scripts/       Dependency-free build and live-feed check
tests/         Worker behavior and asset checks
```

The included `.openai/hosting.json` is a neutral build placeholder. Add your own project identity if deploying with Sites. GitHub upload does not automatically connect this repository to the current website's deployment.

## Assets and usage

Font and technology icon licenses are included next to their assets. The portrait and résumé belong to Sami Mustafa. No license is granted for reuse of personal assets.

## Contact

**Sami Mustafa** — [samimustafa072@gmail.com](mailto:samimustafa072@gmail.com)
