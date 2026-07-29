# Isolated LaTeX compiler

This is a separate, container-based TeX compilation service for the Paper Editor. It supports `pdfLaTeX`, `XeLaTeX`, and `LuaLaTeX`, including the IEEEtran class supplied by `texlive-publishers`.

Do **not** deploy this folder to Vercel. Deploy it as a private Docker service on a platform that supports long-running containers (for example, Google Cloud Run, Render, Railway, Fly.io, or an institution-managed server).

## Deploy

1. Generate a long random secret and set it as `COMPILER_SHARED_SECRET` on the compiler service.
2. Deploy this folder with the included `Dockerfile`. The service listens on port `8080` and exposes `GET /health` plus authenticated `POST /compile`.
3. Restrict inbound traffic to the backend where your hosting provider supports it. The service should not be exposed as a public unauthenticated API.
4. In the **backend Vercel** project, set `LATEX_COMPILER_URL` to `https://your-compiler-host/compile` and set `LATEX_COMPILER_SHARED_SECRET` to the exact same value.
5. Redeploy the backend, then open a paper and choose **Compile**.

## Security model

The service uses a new temporary directory for every request, disables shell escape, restricts TeX file access, limits request/PDF size and execution time, authenticates backend calls, rate limits requests, and deletes each temporary directory afterwards. Keep the container non-privileged and add network egress restrictions at the hosting-provider level where possible.

This is a practical academic-paper compiler, not an unrestricted execution environment. Do not remove the timeout, request limits, or compiler authentication.
