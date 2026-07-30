# Dependency and Configuration Changes

The following dependencies and environment settings have been modified to successfully deprecate Supabase and adopt MongoDB:

## 1. Removed Packages
- `@supabase/supabase-js`: Deleted entirely.
- `ws`: Removed legacy websocket client module.

## 2. Added Packages
- `mongoose`: Added as Object Document Mapper (ODM).

## 3. Configuration & Environment Variables
The `Backend/.env` and `Backend/.env.template` files have been cleaned of all Supabase variables.

**Remaining Keys in `.env.template`:**
- `MONGODB_URI`: Connection URI pointing to MongoDB Atlas / Local MongoDB instance.
- `DATABASE_NAME`: Dedicated MongoDB database name.
- `JWT_SECRET`: Security salt for signing tokens.
- `FIREBASE_PROJECT_ID`: Used for Firebase client authentication initialization.
- `FIREBASE_CLIENT_EMAIL`: Service account email for firebase operations.
- `FIREBASE_PRIVATE_KEY`: Service account key.
