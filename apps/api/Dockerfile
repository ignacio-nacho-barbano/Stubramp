# syntax = docker/dockerfile:1

# Stubramp API (apps/api).
#
# This is a pnpm workspace, so the Docker build context MUST be the monorepo
# ROOT (it needs pnpm-workspace.yaml, pnpm-lock.yaml and packages/*). Even though
# this Dockerfile lives in apps/api, deploy from the repo root so the context is
# the root — see apps/api/fly.toml for the exact command. (This is also why
# `fly launch` failed: its auto-generated Dockerfile ran plain `npm install` from
# apps/api, which can't parse the `workspace:*` dependency protocol.)

# Node 24 (current LTS). Satisfies both Prisma 7 (needs 20.19+/22.12+/24+) and
# pnpm 11 (needs 22.13+).
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Install the exact pnpm version pinned in the root package.json directly.
# We deliberately DON'T use corepack: the bundled corepack trips over stale pnpm
# signing keys ("Cannot find matching keyid"). Keep this in sync with the root
# package.json `packageManager` field.
RUN npm install -g pnpm@11.9.0
WORKDIR /app

# ---- deps + build -----------------------------------------------------------
FROM base AS build
# node-postgres / prisma generate want openssl available.
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the whole workspace (.dockerignore keeps node_modules/dist/.env out).
COPY . .

# Install every workspace package's deps, including devDeps needed to build:
# tsc, prisma, and @stubramp/typescript-config (a workspace:* devDep).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build @stubramp/api AND its workspace deps (@stubramp/contracts) in
# topological order. The trailing `...` on the filter selects the package plus
# its dependencies, so contracts' `tsc` runs first and produces
# packages/contracts/dist — otherwise the api compiles fine (its type resolution
# reads contracts' src) but crashes at runtime on the missing dist/*.js that its
# export map's `default` condition points at.
# `prisma generate` (into apps/api/src/generated) + `tsc` → apps/api/dist.
RUN pnpm --filter "@stubramp/api..." build

# Produce a self-contained bundle at /app/out (compiled dist + node_modules +
# the prisma/ schema & migrations). We deliberately keep devDependencies (no
# --prod): the fly.toml release_command runs `prisma migrate deploy` from this
# image, which needs the prisma CLI (a devDep) and its schema-engine binary
# (downloaded by @prisma/engines' postinstall — so no --ignore-scripts here).
# --legacy: pnpm 10+ otherwise refuses `deploy` unless inject-workspace-packages
# is set. Our only workspace dep is a build-time devDep, so legacy deploy is fine.
RUN pnpm --filter @stubramp/api deploy --legacy /app/out

# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

# Self-contained app: production node_modules + compiled dist + package.json.
COPY --from=build /app/out /app

EXPOSE 3001
CMD ["node", "dist/index.js"]
