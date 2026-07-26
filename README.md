# SuperVisor-Assistant

## Vercel deployment

Deploy `frontend` and `backend` as separate Vercel projects, with each project's Root Directory set to its respective folder.

- In the frontend project, set `VITE_API_URL` to the public backend URL (for example, `https://your-backend.vercel.app`) and redeploy the frontend. Vite embeds this value during the build.
- In the backend project, set `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` / `GEMINI_MODEL`. Set `FRONTEND_URL` to the frontend production URL; multiple origins may be comma-separated.
- Vercel serverless storage is ephemeral. The current local upload route is suitable for local development only; use object storage before relying on uploads in production.
