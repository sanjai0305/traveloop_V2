# Production Deployment Checklist

Follow this checklist when preparing to deploy TravelLoop V2 to production:

## 1. Database Setup
- [ ] Configure MongoDB Atlas cluster.
- [ ] Whitelist the production server IP addresses.
- [ ] Set `MONGODB_URI` environment variable pointing to the Atlas cluster.
- [ ] Set `DATABASE_NAME` environment variable.

## 2. Firebase Administration
- [ ] Verify that no `serviceAccountKey.json` files are committed.
- [ ] Inject `FIREBASE_PROJECT_ID`.
- [ ] Inject `FIREBASE_CLIENT_EMAIL`.
- [ ] Inject `FIREBASE_PRIVATE_KEY` (ensuring it is wrapped inside double quotes and newlines are escaped as `\n`).
- [ ] Inject `FIREBASE_CLIENT_ID`.

## 3. Web Security & Secrets
- [ ] Set a secure `JWT_SECRET` value.
- [ ] Enforce rate limits and HTTPS redirects.
