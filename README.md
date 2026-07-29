# SuperVisor-Assistant

## Vercel deployment

Deploy `frontend` and `backend` as separate Vercel projects, with each project's Root Directory set to its respective folder.

- In the frontend project, set `VITE_API_URL` to the public backend URL (for example, `https://your-backend.vercel.app`) and redeploy the frontend. Vite embeds this value during the build.
- In the backend project, set `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` / `GEMINI_MODEL`. Set `FRONTEND_URL` to the frontend production URL; multiple origins may be comma-separated.
- Use a `JWT_SECRET` of at least 32 random characters, keep `ALLOW_PUBLIC_SUPERVISOR_REGISTRATION=false`, and set `JWT_EXPIRES_IN=8h` (or your institution’s shorter policy). Supervisors are provisioned by an administrator through the user-management screen.
- Vercel serverless storage is ephemeral and the app intentionally blocks local-file uploads in production. Configure a private object-storage provider with authenticated downloads before enabling production uploads.
- `FRONTEND_URL` is an exact allow-list, not a wildcard. Add each permitted production or preview origin explicitly, comma-separated.

## Paper Editor and real LaTeX compilation

The Paper Editor stores project-scoped LaTeX drafts, provides a Monaco source editor, Ctrl/Cmd+S and autosave, PDF compilation controls, compiler logs, a resizable source/PDF layout, and a literature search that combines OpenAlex and Crossref metadata. Search results are discovery aids: authors must read, verify, and cite the original work.

Real IEEE-format PDF output is compiled by the separate Docker service in [`latex-compiler`](./latex-compiler), not by the browser or Vercel function. It provides `pdfLaTeX`, `XeLaTeX`, and `LuaLaTeX`, common IEEE/TeX Live packages, per-request isolation, timeouts, shell-escape disabled, and compiler authentication. Deploy that folder to a container host, configure its URL and matching shared secret in the backend Vercel project, then redeploy the backend. Detailed instructions are in [`latex-compiler/README.md`](./latex-compiler/README.md).

The Overleaf button remains useful for external collaboration and its own native tooling. It opens a user-owned Overleaf project rather than embedding it, preserving Overleaf's editor, compiler, permissions, and collaboration model. Eligible Overleaf plans can use its Git integration for fuller synchronization.
