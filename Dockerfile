FROM node:lts-alpine AS base
WORKDIR /app
RUN npm i -g pnpm
COPY pnpm-lock.yaml package.json ./
RUN pnpm i --frozen-lockfile
# Rebuild esbuild binary for the current platform
RUN pnpm rebuild esbuild
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Development stage
FROM base AS development
CMD ["pnpm", "run", "dev"]

# Production stage
FROM base AS production
RUN pnpm run build
CMD ["pnpm", "start"]