# Isolated LaTeX compiler

This is a separate, container-based TeX compilation service for the Paper Editor. It supports `pdfLaTeX`, `XeLaTeX`, and `LuaLaTeX`, including the IEEEtran class supplied by `texlive-publishers`.

Do **not** deploy this folder to Vercel. Deploy it as a private Docker service on a platform that supports long-running containers (for example, Google Cloud Run, Render, Railway, Fly.io, or an institution-managed server).

## Deploy

1. Generate a long random secret and set it as `COMPILER_SHARED_SECRET` on the compiler service.
2. Deploy this folder with the included `Dockerfile`. The service listens on port `8080` and exposes `GET /health` plus authenticated `POST /compile`.
3. Restrict inbound traffic to the backend where your hosting provider supports it. The service should not be exposed as a public unauthenticated API.
4. In the **backend Vercel** project, set `LATEX_COMPILER_URL` to `https://your-compiler-host/compile` and set `LATEX_COMPILER_SHARED_SECRET` to the exact same value.
5. Redeploy the backend, then open a paper and choose **Compile**.

### Quick Render deployment

For a Render web service, import [`latex-compiler/render.yaml`](./render.yaml) as the Blueprint file from this repository. It uses the existing Dockerfile, a `/health` health check, and deliberately marks `COMPILER_SHARED_SECRET` as `sync: false`, so Render prompts for the value instead of storing it in Git. This must be a **web** service because the Vercel backend needs to reach it over HTTPS; the `POST /compile` route remains protected by the shared secret and must never be called directly from the browser.

After the Render deployment is healthy, copy its HTTPS URL and configure the backend Vercel project as follows:

```text
LATEX_COMPILER_URL=https://your-render-service.onrender.com/compile
LATEX_COMPILER_SHARED_SECRET=<the exact COMPILER_SHARED_SECRET value>
```

Redeploy the backend and refresh the Paper Editor. Its **Check again** action should report the compiler as ready. The unauthenticated `GET /health` route is only for service monitoring; compilation requires the matching `X-Compiler-Secret` header sent by the backend.

## Security model

The service uses a new temporary directory for every request, disables shell escape, restricts TeX file access, limits request/PDF size and execution time, authenticates backend calls, rate limits requests, and deletes each temporary directory afterwards. Keep the container non-privileged and add network egress restrictions at the hosting-provider level where possible.

The service delivers PDFs up to **3 MB**. This is intentional: the backend relays the Base64 PDF through a Vercel function, whose response size is limited. Use external image storage and reduced-resolution figures for larger papers.

This is a practical academic-paper compiler, not an unrestricted execution environment. Do not remove the timeout, request limits, compiler authentication, shell-escape restriction, or temporary-directory isolation.
