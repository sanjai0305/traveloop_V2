# ─────────────────────────────────────────────
#  Backend — Node.js 20 LTS  (Production)
# ─────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install OS deps for canvas / tesseract native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev

# ── Dependencies ──────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Production image ─────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove dev/test helper scripts
RUN rm -f check_deleted_owners.js cleanup.js get_otp.js testReferralFlow.js \
         verifyPortalEnhancements.js verify_admin_portal.js verify_apis.js \
         verify_budget.js verify_chat.js verify_collaboration.js \
         verify_firebase_chat.js verify_flight.js verify_multibudget.js

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
