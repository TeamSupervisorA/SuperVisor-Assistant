# Isolated code-runner gateway

This is the authenticated gateway for the Code IDE's non-JavaScript runtimes. It does **not** execute code itself. It forwards a tightly limited request to a private, self-hosted [Piston](https://github.com/engineer-man/piston) service, which performs execution in its own isolated environment.

Do not deploy Piston, this gateway, or arbitrary language runtimes to Vercel. Vercel functions are not an appropriate place to run untrusted compilers or programs.

## Deployment

1. Provision a Linux container host that supports Docker, cgroups v2, and private container networking.
2. Follow Piston's official self-hosting instructions to run Piston **privately**. Do not expose its port publicly. Install only the runtimes you want to offer, such as Python, C/C++, Java, Go, Rust, TypeScript, PHP, Ruby, Julia, R, SQLite, and Bash.
3. Deploy this folder as a second container on the same private network. Set `PISTON_URL` to Piston's internal `http://piston:2000/api/v2/execute` endpoint and set a random `RUNNER_SHARED_SECRET` of at least 32 characters.
4. Expose only this gateway over HTTPS, preferably restricted to the backend's egress addresses where your hosting provider supports it.
5. In the **backend Vercel** project, set:

   ```text
   CODE_RUNNER_URL=https://your-code-runner.example.com/execute
   CODE_RUNNER_SHARED_SECRET=<the exact RUNNER_SHARED_SECRET value>
   CODE_RUNNER_LANGUAGES=javascript,typescript,python,java,c,cpp,csharp,go,rust,r,julia,php,ruby,sql,bash
   ```

6. Redeploy the backend. Open `https://your-code-runner.example.com/health`; it should return `success: true`, `pistonReachable: true`, and list `c` under `availableLanguages`, then run a short non-sensitive program from the Code IDE.

## Resolving “This language needs the isolated code runner”

That message means the **backend Vercel project** is missing or cannot validate `CODE_RUNNER_URL`; it does not mean that the source code is invalid. The gateway must be publicly reachable by the Vercel backend over HTTPS, while Piston must stay private on the same Docker-capable Linux host or private network as the gateway.

Piston starts without language runtimes in its standard self-hosted setup. Use its official self-hosting and package-management instructions to install only the languages you approve, such as `c` for the C editor option. Confirm the gateway health response, then run a harmless `Hello, World!` program through the Code IDE. A healthy gateway only proves that Piston is reachable; the program result confirms that the selected language is installed.

## Safety boundaries

- The gateway requires the shared secret, permits one source file only, rejects arguments, constrains source (150,000 characters / 600 KiB) and stdin size, and applies strict Piston CPU, wall-time, memory, and output limits.
- It allows only the fixed language list used by the application; users cannot select a package manager command, container image, runtime URL, or arbitrary environment variable.
- Piston must remain private and retain its own isolation, cgroup, non-root, output, process, and network limits. This gateway is not a replacement for Piston's sandbox.
- Libraries are an administrator decision: install and patch approved runtime packages when provisioning Piston. The application intentionally never downloads packages at execution time.
