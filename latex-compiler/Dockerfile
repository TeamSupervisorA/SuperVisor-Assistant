FROM node:22-bookworm-slim

ENV NODE_ENV=production

# The packages below cover the IEEEtran class and the common IEEE mathematics,
# algorithm, graphics, bibliography, XeLaTeX, and LuaLaTeX workflows.
RUN apt-get update && apt-get install -y --no-install-recommends \
    latexmk texlive-latex-base texlive-latex-recommended texlive-latex-extra \
    texlive-fonts-recommended texlive-publishers texlive-science texlive-xetex \
    texlive-luatex ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server.js ./
RUN useradd --system --create-home --uid 10001 compiler
USER compiler
EXPOSE 8080
CMD ["node", "server.js"]
