# SuperVisor-Assistant

## Vercel deployment

Deploy `frontend` and `backend` as separate Vercel projects, with each project's Root Directory set to its respective folder.

- In the frontend project, set `VITE_API_URL` to the public backend URL (for example, `https://your-backend.vercel.app`) and redeploy the frontend. Vite embeds this value during the build.
- The frontend security policy currently permits the deployed backend at `https://super-visor-assistant-y512.vercel.app` and the browser-created PDF preview. If you change `VITE_API_URL`, replace that exact HTTPS origin in `frontend/vercel.json` before deploying; do not reopen `connect-src` to every HTTPS site.
- In the backend project, set `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` / `GEMINI_MODEL`. Set `FRONTEND_URL` to the frontend production URL; multiple origins may be comma-separated.
- After deploying the backend, open `https://your-backend.vercel.app/api/health`. It must return `{"success":true,"database":"connected"}` before registration, login, project creation, or settings can work. If it returns `503`, correct `MONGODB_URI` and allow database access from Vercel in MongoDB Atlas Network Access.
- Use a `JWT_SECRET` of at least 32 random characters, keep `ALLOW_PUBLIC_SUPERVISOR_REGISTRATION=false`, and set `JWT_EXPIRES_IN=8h` (or your institution’s shorter policy). Supervisors are provisioned by an administrator through the user-management screen.
- Vercel serverless storage is ephemeral and the app intentionally blocks local-file uploads in production. Configure a private object-storage provider with authenticated downloads before enabling production uploads.
- `FRONTEND_URL` is an exact allow-list, not a wildcard. Add each permitted production or preview origin explicitly, comma-separated.
- To enable password-reset email, set `RESEND_API_KEY` and `EMAIL_FROM` (a verified Resend sender) in the backend project, then redeploy. Reset links use the first origin in `FRONTEND_URL`.

## Account verification, recovery, and Google sign-in

New password-based registrations are not activated until the person enters the six-digit code sent to their email. The code is short-lived and stored only as a hash. Password-reset requests always return the same confirmation message, whether or not the address exists, so the endpoint cannot be used to enumerate accounts.

### 1. Enable transactional email

1. In Resend, verify a domain that you own and create an API key.
2. In the **backend Vercel project**, add these production variables:

   ```text
   RESEND_API_KEY=re_...
   EMAIL_FROM=SuperVisorAI <noreply@your-verified-domain.example>
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

3. Redeploy the backend. Use the production frontend URL as the first `FRONTEND_URL` origin because reset links are built from it.
4. Test with a non-administrator account: register, enter the email code, use **Forgot password?**, and follow the one-time reset link. Check the spam folder while the sending domain is new.

### 2. Enable Continue with Google

1. In Google Cloud Console, create or select a project, configure its OAuth consent screen, and create an OAuth 2.0 **Web application** client.
2. Under **Authorized JavaScript origins**, add the exact frontend origins, such as `https://your-frontend.vercel.app`. Add preview origins only if you deliberately test Google sign-in there.
3. Copy the Web client ID (it ends in `.apps.googleusercontent.com`) into both Vercel projects:

   ```text
   # frontend Vercel project — public identifier, not a secret
   VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com

   # backend Vercel project — used to verify the token audience
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   ```

4. Redeploy the backend and then the frontend. Do **not** put an OAuth client secret in the frontend or add a Google service-account key to this application.
5. A new Google user receives a short-lived profile-completion session and is then created as a student. Google sign-in cannot self-provision an administrator or supervisor.

## Roles and access

- **Students:** use `/register`, verify their email, then sign in at `/login`.
- **Supervisors:** an active administrator promotes or provisions a verified account through **Admin dashboard → Manage users**. The supervisor then uses the normal `/login` page and is directed to `/supervisor-dashboard` automatically.
- **Administrators:** use `/admin-login` and are directed to `/admin-dashboard`. Administrator accounts are never created by public registration. Keep `ALLOW_PUBLIC_SUPERVISOR_REGISTRATION=false` in production.

The authenticated dashboards enforce role checks on both the client and server. A student cannot access supervisory review or administrative routes simply by changing a URL.

### Bootstrap the first administrator

Run this once from the `backend` folder on a trusted machine that has the correct `MONGODB_URI` in its local `.env`. It creates a new administrator only when the email is unused; it never changes an existing account and is not exposed over HTTP.

```powershell
cd backend
$env:ADMIN_INITIAL_PASSWORD = 'use-a-unique-password-of-at-least-12-characters'
npm run create-admin -- "Institution Administrator" admin@your-domain.example
Remove-Item Env:ADMIN_INITIAL_PASSWORD
```

Then visit `/admin-login`. From **Manage users**, promote a verified student to supervisor or restore/deactivate accounts. Do not turn on public supervisor registration merely to create institutional staff accounts.

## Gemini academic-assistance workflows

Set `GEMINI_API_KEY` and, if needed, a Gemini model available to that key in `GEMINI_MODEL`. The default is `gemini-3.6-flash`, a current GA Flash model for academic assistance. Google Search grounding is subject to the Google AI project’s model access, quota, and billing settings; the integrity workflow reports quota exhaustion clearly rather than fabricating a result. The backend keeps the key private and exposes only a configured/not-configured status at `/api/ai/status`. It rate-limits AI requests and records user-scoped interaction history for accountability.

- Students can generate a proposal planning outline, edit it, and save it as their own draft. They can also request project ideas and formative feedback.
- Students and the assigned supervisor can generate a report narrative draft from the project’s stored tasks, submissions, and progress logs. The draft explicitly requires review before formal use.
- Supervisors and administrators can run a project-scoped plagiarism/integrity screen for a submission that includes at least 200 characters of stored text. A deterministic eight-word-sequence comparison checks up to 100 recent text submissions in the selected project, and Gemini Google Search grounding adds substantiated public-web sources when configured and available. The UI reports exactly which coverage ran.
- Identical text reuses the current report, concurrent duplicate checks are blocked, and editing a submission marks its earlier reports as superseded. Students see only reports for their own submissions; internal source details remain available to assigned reviewers without exposing another student’s draft.
- A supervisor may opt into automatic screening in Settings. It runs only when submitted text is available. Missing or exhausted Gemini quota does not block the submission or the local project-corpus comparison; the report clearly marks public-web coverage as unavailable and can retry it later.
- Every result is a similarity-screening aid, **not** a plagiarism verdict or proof of originality. Review the original wording, quotations, citations, templates, context, and institutional policy before acting.

Gemini use is subject to Google’s policies and data handling terms. Do not submit sensitive personal, unpublished, or restricted research data unless your institution has approved that use. The app prompts Gemini not to invent citations, sources, findings, or grades, but students and supervisors must verify all output.

## Paper Editor and real LaTeX compilation

The Paper Editor stores project-scoped LaTeX drafts, provides a Monaco source editor, Ctrl/Cmd+S and autosave, PDF compilation controls, compiler logs, a resizable source/PDF layout, and a literature search that combines OpenAlex and Crossref metadata. Set the optional `OPENALEX_API_KEY` backend variable to include OpenAlex results reliably; Crossref discovery remains available without it. Search results are discovery aids: authors must read, verify, and cite the original work.

Real IEEE-format PDF output is compiled by the separate Docker service in [`latex-compiler`](./latex-compiler), not by the browser or Vercel function. It provides `pdfLaTeX`, `XeLaTeX`, and `LuaLaTeX`, common IEEE/TeX Live packages, per-request isolation, timeouts, shell-escape disabled, and compiler authentication. Deploy that folder to a container host, configure its URL and matching shared secret in the **backend** Vercel project, then redeploy the backend. The browser receives PDFs up to 3 MB because the backend relays them through a Vercel response. Detailed instructions are in [`latex-compiler/README.md`](./latex-compiler/README.md).

If the Paper Editor says that compilation is not configured, the source is saved correctly; the backend deployment has not been connected to a compiler yet. Complete these checks in order:

1. Deploy the `latex-compiler` Docker service (never to Vercel) with `NODE_ENV=production` and a new `COMPILER_SHARED_SECRET` of at least 32 characters.
2. Confirm `https://your-compiler-host/health` returns a successful response.
3. In the **backend Vercel project only**, add `LATEX_COMPILER_URL=https://your-compiler-host/compile` and `LATEX_COMPILER_SHARED_SECRET` with the exact same secret. Do not put either variable in the frontend project.
4. Redeploy the backend. Refresh the Paper Editor and use **Check again** in its setup notice; it will enable compilation only after the backend reports the compiler as ready.

The Overleaf button remains useful for external collaboration and its own native tooling. It opens a user-owned Overleaf project rather than embedding it, preserving Overleaf's editor, compiler, permissions, and collaboration model. Eligible Overleaf plans can use its Git integration for fuller synchronization.

## Code IDE runtime

The Code IDE uses the Monaco editor (the editor core used by VS Code) and includes language selection, starter templates, output at the bottom, a fullscreen workspace, Ctrl/Cmd+S saving, and a hover-expandable navigation rail. JavaScript runs in a four-second browser worker for immediate, isolated feedback.

Other languages are deliberately executed only through an isolated, self-hosted Piston-compatible runner. The repository includes an authenticated [`code-runner`](./code-runner) gateway for this purpose. Deploy Piston privately on a Docker/cgroup-capable Linux host, deploy the gateway in front of it, configure `CODE_RUNNER_URL` to the gateway's `/execute` endpoint and set the same `CODE_RUNNER_SHARED_SECRET` in the backend and gateway, then redeploy the backend. Do not send private academic code to an untrusted public execution service. Libraries are limited to the vetted runtimes and packages installed by the runner administrator; the application does not download arbitrary packages at execution time.

If the Code IDE says that a language needs the isolated runner, the source is saved correctly; C, C++, Python, Java, and the other non-JavaScript runtimes are intentionally not run inside a Vercel function. Deploy Piston privately on a Linux host with Docker and cgroup v2, install the approved runtime (for example, C), then deploy the `code-runner` gateway on that host's private network. Set `RUNNER_SHARED_SECRET` and `PISTON_URL` on the gateway, then set `CODE_RUNNER_URL=https://your-code-runner-host/execute` plus the matching `CODE_RUNNER_SHARED_SECRET` in the **backend Vercel** project and redeploy it. Do not put either setting in the frontend. The gateway's `/health` response verifies that it can reach Piston; details are in [`code-runner/README.md`](./code-runner/README.md).

The Monaco editor is distributed under the MIT license: https://github.com/microsoft/monaco-editor. Piston is also MIT-licensed and provides the isolated multi-language runner interface: https://github.com/engineer-man/piston.
