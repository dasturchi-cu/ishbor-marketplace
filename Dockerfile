FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
# --omit=optional: skip wasm/native optional bindings that differ per platform
RUN npm ci --omit=optional

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
