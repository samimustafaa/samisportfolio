<div align="center">

# 👨‍💻 **Sami Mustafa — Portfolio**

**Front End Developer · Instructor · Always Learning**

A personal space for the things I build, the skills I develop, and the ideas I share.

🌍 **North Macedonia** &nbsp; · &nbsp; ⚡ **Lightweight frontend** &nbsp; · &nbsp; 🔄 **Live GitHub activity**

[🌐 **Visit the website**](https://sami-portfolio-studio.samimustafa072.chatgpt.site) &nbsp; · &nbsp; [🐙 **GitHub**](https://github.com/samimustafaa) &nbsp; · &nbsp; [✉️ **Get in touch**](mailto:samimustafa072@gmail.com)

</div>

---

## ✨ **What’s inside**

| Feature | Experience |
| --- | --- |
| 🖼️ **Project previews** | Nine selected projects with animated hover previews and touch-friendly controls. |
| 🎨 **Interactive details** | Name animations, portrait tilt, and subtle motion effects. |
| 🧩 **Technology icons** | Real icons for HTML, CSS, JavaScript, WordPress, React, C++, C#, Python, and TypeScript. |
| 🐙 **Latest commit** | Repository visibility, branch, commit ID, committer, date, time, and real change counts and avatar when available. |
| 🔄 **Automatic syncing** | GitHub activity refreshes every **30 seconds** while the tab is visible. |
| 🔐 **Private activity** | Authorized private repository commits, with GitHub credentials kept on the server. |
| ⚡ **Faster repeat visits** | Early commit fetching, per-tab response restoration, background refreshes, and versioned asset caching. |
| ♿ **Accessible interactions** | Keyboard navigation, reduced-motion support, and locally hosted fonts. |

## 🛠️ **Built with**

**HTML · CSS · Vanilla JavaScript · ES module Worker**

The frontend uses native browser APIs. The Worker serves the assets and the GitHub feed, and the build has **no third-party npm dependencies**.

> 💡 The technologies listed in the portfolio’s skills section represent my broader skill set. The stack above describes this project’s implementation.

## 🚀 **Run the project**

**Requirement:** Node.js **22 or newer**.

```sh
git clone https://github.com/samimustafaa/samisportfolio.git
cd samisportfolio

# Build the Worker and embedded frontend assets
npm run build

# Run the Worker tests
npm test
```

The build generates **`dist/server/index.js`**. Deploy this file with a compatible Worker host.

Serving **`dist/`** as static files previews the frontend. Live GitHub activity requires the Worker endpoint **`/api/github/commits`**.

## 🔑 **Connect GitHub activity**

Set these variables in your host’s runtime settings:

| Variable | Purpose |
| --- | --- |
| **`GITHUB_USERNAME`** | GitHub username; defaults to `samimustafaa`. |
| **`GITHUB_TOKEN`** | Server-side secret with read access to the repositories you want to include. |

For private activity, authorize the token to read the relevant private repositories.

> 🔒 **Keep your token on the server.** Never add it to frontend code or commit it to Git. `.env.example` documents the variable names only; the Worker reads runtime bindings rather than loading that file itself.

## 📁 **Project structure**

| Path | Contents |
| --- | --- |
| **`dist/`** | Frontend HTML, CSS, JavaScript, fonts, and icons. |
| **`worker/`** | GitHub feed and static asset serving. |
| **`scripts/`** | Dependency-free build and live-feed check. |
| **`tests/`** | Worker behavior and asset checks. |

The included **`.openai/hosting.json`** is a neutral build placeholder. Add your own project identity when deploying with Sites. Uploading this code to GitHub does not automatically connect the repository to the current website’s deployment.

## 🖼️ **Personal assets**

The portrait and résumé are currently **omitted from this public export** pending approval to publish them:

- **Portrait:** `dist/assets/sami.webp`
- **Résumé:** `dist/assets/Sami-Mustafa-CV.pdf`

The frontend references these paths. Add your approved files before deploying this copy.

## 📜 **Asset licenses**

Font and technology icon licenses are included beside their assets. The portrait and résumé belong to **Sami Mustafa**; no license is granted for reuse of those personal assets.

---

<div align="center">

### ✉️ **Let’s build something together**

**Sami Mustafa** · [**samimustafa072@gmail.com**](mailto:samimustafa072@gmail.com)

*Made with curiosity & code.*

</div>
