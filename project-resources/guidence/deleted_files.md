# Deleted Supabase and SQL Migration Files

The following files and directories have been permanently removed from the project repository as they are obsolete after migrating to MongoDB Atlas:

## 1. Supabase Client & Setup Configuration
- `Backend/config/supabase.js`: Obsolete client initialization module.
- `Backend/verify_supabase.js`: Diagnostic script checking Supabase connectivity.

## 2. Legacy PostgreSQL Schema & SQL Migrations
- `Backend/schema.sql`: Centralized SQL file defining PostgreSQL schema tables, indexes, and triggers.
- `Backend/migrations/01_add_missing_user_columns.sql`: Individual SQL migration script adding legacy user profile tables.
- `Backend/migrations/`: Empty SQL migrations directory removed.

## 3. SQL Query Wrappers & Mock Utilities
- `Backend/config/mongooseMock.js`: Intermediary database mock mapping MongoDB-like calls to Supabase.
- `Backend/models/queryHelper.js`: Query builders executing direct SQL statements.

## 4. Unused Controllers & Models
- `Backend/controllers/communityController.js`: Unused community board controller.
- `Backend/models/CommunityPost.js`: Legacy model template.
