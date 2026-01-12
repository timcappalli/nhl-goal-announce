FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM dhi.io/node:25
WORKDIR /app
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . /app

ENTRYPOINT []
CMD [ "node", "app.js" ]