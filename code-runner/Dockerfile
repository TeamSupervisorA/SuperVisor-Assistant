FROM node:22-bookworm-slim

ENV NODE_ENV=production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server.js ./
RUN useradd --system --create-home --uid 10001 runner
USER runner
EXPOSE 8080
CMD ["node", "server.js"]
