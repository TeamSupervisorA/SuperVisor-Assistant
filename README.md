# SuperVisor-Assistant

## Vercel deployment

Deploy `frontend` and `backend` as separate Vercel projects, with each project's Root Directory set to its respective folder.

- In the frontend project, set `VITE_API_URL` to the public backend URL (for example, `https://your-backend.vercel.app`) and redeploy the frontend. Vite embeds this value during the build.
- In the backend project, set `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` / `GEMINI_MODEL`. Set `FRONTEND_URL` to the frontend production URL; multiple origins may be comma-separated.
- Use a `JWT_SECRET` of at least 32 random characters, keep `ALLOW_PUBLIC_SUPERVISOR_REGISTRATION=false`, and set `JWT_EXPIRES_IN=8h` (or your institution’s shorter policy). Supervisors are provisioned by an administrator through the user-management screen.
- Vercel serverless storage is ephemeral and the app intentionally blocks local-file uploads in production. Configure a private object-storage provider with authenticated downloads before enabling production uploads.
- `FRONTEND_URL` is an exact allow-list, not a wildcard. Add each permitted production or preview origin explicitly, comma-separated.

## Research Studio

The project workspace at `/research-studio` stores project-scoped LaTeX drafts and implementation notes, includes a Monaco editor, source download, a readable draft preview, and a literature search that combines OpenAlex and Crossref metadata. Search results are discovery aids: authors must read, verify, and cite the original work.

The Overleaf button opens a user-owned Overleaf project rather than embedding it. This preserves Overleaf's native editor, compiler, permissions, and collaboration model. Users can link an Overleaf project URL and download the `.tex` source for transfer; teams with eligible Overleaf plans can use its Git integration for a fuller synchronisation workflow.
