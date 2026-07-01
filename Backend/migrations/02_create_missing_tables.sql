-- PostgreSQL Migration: Create missing tables for travel features
-- Enable UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    "tripId" UUID,
    "isInvite" BOOLEAN DEFAULT false,
    "inviteStatus" VARCHAR(50) DEFAULT NULL,
    read BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Flights Table
CREATE TABLE IF NOT EXISTS flights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tripId" UUID REFERENCES trips(id) ON DELETE CASCADE,
    "airline" VARCHAR(255),
    "flightNumber" VARCHAR(50),
    "departureAirport" VARCHAR(100),
    "arrivalAirport" VARCHAR(100),
    "departureTime" TIMESTAMP WITH TIME ZONE,
    "arrivalTime" TIMESTAMP WITH TIME ZONE,
    "status" VARCHAR(50) DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Journals Table
CREATE TABLE IF NOT EXISTS journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tripId" UUID REFERENCES trips(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    date VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    mood VARCHAR(50) DEFAULT 'great',
    highlights JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tripId" UUID REFERENCES trips(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Chat Read Statuses Table
CREATE TABLE IF NOT EXISTS chat_read_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tripId" UUID REFERENCES trips(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "lastSeenAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_read_status_unique UNIQUE ("tripId", "userId")
);

-- 6. Exchange Rate Caches Table
CREATE TABLE IF NOT EXISTS exchange_rate_caches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "baseCurrency" VARCHAR(10) UNIQUE NOT NULL,
    rates JSONB DEFAULT '{}'::jsonb,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Commissions Table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "defaultRate" NUMERIC(5,2) DEFAULT 10.00,
    "updatedBy" UUID REFERENCES admins(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Settlements Table
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "bookingId" UUID REFERENCES bookings(id) ON DELETE CASCADE,
    "tripId" UUID REFERENCES agent_trips(id) ON DELETE CASCADE,
    "agentId" UUID REFERENCES agents(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    "settledAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for all newly created tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rate_caches ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create default permissive policies for development/migration
CREATE POLICY "Permissive read/write notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write flights" ON flights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write journals" ON journals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write chat_read_statuses" ON chat_read_statuses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write exchange_rate_caches" ON exchange_rate_caches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write commissions" ON commissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write settlements" ON settlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write admin_notifications" ON admin_notifications FOR ALL USING (true) WITH CHECK (true);

-- 11. Add missing fields to trips table for traveler collaboration and share metrics
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS collaborators JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS "shareAnalytics" JSONB DEFAULT '{"views": 0, "visitors": 0, "visitorCountries": [], "lastViewed": null}'::jsonb;
