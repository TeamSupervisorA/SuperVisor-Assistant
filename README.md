# SuperVisor-Assistant

## Vercel deployment

Deploy `frontend` and `backend` as separate Vercel projects, with each project's Root Directory set to its respective folder.

- In the frontend project, set `VITE_API_URL` to the public backend URL (for example, `https://your-backend.vercel.app`) and redeploy the frontend. Vite embeds this value during the build.
- In the backend project, set `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` / `GEMINI_MODEL`. Set `FRONTEND_URL` to the frontend production URL; multiple origins may be comma-separated.
- After deploying the backend, open `https://your-backend.vercel.app/api/health`. It must return `{"success":true,"database":"connected"}` before registration, login, project creation, or settings can work. If it returns `503`, correct `MONGODB_URI` and allow database access from Vercel in MongoDB Atlas Network Access.
- Use a `JWT_SECRET` of at least 32 random characters, keep `ALLOW_PUBLIC_SUPERVISOR_REGISTRATION=false`, and set `JWT_EXPIRES_IN=8h` (or your institution’s shorter policy). Supervisors are provisioned by an administrator through the user-management screen.
- Vercel serverless storage is ephemeral and the app intentionally blocks local-file uploads in production. Configure a private object-storage provider with authenticated downloads before enabling production uploads.
- `FRONTEND_URL` is an exact allow-list, not a wildcard. Add each permitted production or preview origin explicitly, comma-separated.
- To enable password-reset email, set `RESEND_API_KEY` and `EMAIL_FROM` (a verified Resend sender) in the backend project, then redeploy. Reset links use the first origin in `FRONTEND_URL`.

## Gemini academic-assistance workflows

Set `GEMINI_API_KEY` and, if needed, a Gemini model available to that key in `GEMINI_MODEL`. The backend keeps the key private and exposes only a configured/not-configured status at `/api/ai/status`. It rate-limits AI requests and records user-scoped interaction history for accountability.

- Students can generate a proposal planning outline, edit it, and save it as their own draft. They can also request project ideas and formative feedback.
- Students and the assigned supervisor can generate a report narrative draft from the project’s stored tasks, submissions, and progress logs. The draft explicitly requires review before formal use.
- Supervisors and administrators can run an integrity screen for a submission that includes at least 200 characters of pasted text. It uses Gemini Google Search grounding and stores only grounded source metadata. It is a similarity-screening aid, **not** a plagiarism verdict; review the original sources and follow institutional policy before acting.
- A supervisor may opt into automatic integrity screening in Settings. It runs only when submitted text is available; an AI/provider failure never blocks submission.

Gemini use is subject to Google’s policies and data handling terms. Do not submit sensitive personal, unpublished, or restricted research data unless your institution has approved that use. The app prompts Gemini not to invent citations, sources, findings, or grades, but students and supervisors must verify all output.

## Paper Editor and real LaTeX compilation

The Paper Editor stores project-scoped LaTeX drafts, provides a Monaco source editor, Ctrl/Cmd+S and autosave, PDF compilation controls, compiler logs, a resizable source/PDF layout, and a literature search that combines OpenAlex and Crossref metadata. Search results are discovery aids: authors must read, verify, and cite the original work.

Real IEEE-format PDF output is compiled by the separate Docker service in [`latex-compiler`](./latex-compiler), not by the browser or Vercel function. It provides `pdfLaTeX`, `XeLaTeX`, and `LuaLaTeX`, common IEEE/TeX Live packages, per-request isolation, timeouts, shell-escape disabled, and compiler authentication. Deploy that folder to a container host, configure its URL and matching shared secret in the backend Vercel project, then redeploy the backend. Detailed instructions are in [`latex-compiler/README.md`](./latex-compiler/README.md).

The Overleaf button remains useful for external collaboration and its own native tooling. It opens a user-owned Overleaf project rather than embedding it, preserving Overleaf's editor, compiler, permissions, and collaboration model. Eligible Overleaf plans can use its Git integration for fuller synchronization.

## Code IDE runtime

The Code IDE uses the Monaco editor (the editor core used by VS Code) and includes language selection, starter templates, output at the bottom, a fullscreen workspace, Ctrl/Cmd+S saving, and a hover-expandable navigation rail. JavaScript runs in a four-second browser worker for immediate, isolated feedback.

Other languages are deliberately executed only through an isolated, self-hosted Piston-compatible runner. Configure `CODE_RUNNER_URL` in the backend environment to its `/api/v2/execute` endpoint, optionally set the same `CODE_RUNNER_SHARED_SECRET` on the backend and a protecting proxy, then redeploy the backend. Do not send private academic code to an untrusted public execution service. Libraries are limited to the vetted runtimes and packages installed by the runner administrator; the application does not download arbitrary packages at execution time.

The Monaco editor is distributed under the MIT license: https://github.com/microsoft/monaco-editor. Piston is also MIT-licensed and provides the isolated multi-language runner interface: https://github.com/engineer-man/piston.
