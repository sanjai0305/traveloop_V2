-- Idempotent PostgreSQL Migration: Add missing columns to users table
-- Safe to execute repeatedly on live Supabase databases

ALTER TABLE users ADD COLUMN IF NOT EXISTS "acceptedTerms" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "termsVersion" VARCHAR(50) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "firebaseUid" VARCHAR(255) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "upiId" VARCHAR(255) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "language" VARCHAR(50) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "privacyVisibility" VARCHAR(50) DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "savedDestinations" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "achievements" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastActiveDate" VARCHAR(50) DEFAULT '';
