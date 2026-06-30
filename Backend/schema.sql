-- Traveloop V2 PostgreSQL Schema Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    city VARCHAR(100),
    country VARCHAR(100),
    "additionalInfo" TEXT DEFAULT '',
    password VARCHAR(255),
    "googleId" VARCHAR(255) DEFAULT NULL,
    avatar TEXT DEFAULT '',
    "authProvider" VARCHAR(50) DEFAULT 'email',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    "acceptedTerms" BOOLEAN DEFAULT false,
    "termsAcceptedAt" TIMESTAMP WITH TIME ZONE,
    "termsVersion" VARCHAR(50) DEFAULT '',
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "firebaseUid" VARCHAR(255) DEFAULT '',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "companyName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    "vehicleNumber" VARCHAR(50),
    "licenseNumber" VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AGENT TRIPS TABLE
CREATE TABLE IF NOT EXISTS agent_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "agentId" UUID REFERENCES agents(id) ON DELETE CASCADE,
    "driverId" UUID REFERENCES drivers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    "shortDescription" TEXT,
    description TEXT,
    destinations TEXT[] DEFAULT '{}',
    duration VARCHAR(100),
    "startDate" VARCHAR(50) NOT NULL,
    "endDate" VARCHAR(50) NOT NULL,
    "departureTime" VARCHAR(50),
    "arrivalTime" VARCHAR(50),
    "pickupLocation" VARCHAR(255),
    "busType" VARCHAR(100),
    "busNumber" VARCHAR(50),
    "busImages" TEXT[] DEFAULT '{}',
    gallery TEXT[] DEFAULT '{}',
    "coverImage" TEXT DEFAULT '',
    "driverName" VARCHAR(255),
    "driverPhone" VARCHAR(50),
    "originalPrice" NUMERIC(10,2) DEFAULT 0.00,
    "offerPrice" NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'published',
    "boardingStatus" VARCHAR(50) DEFAULT 'CLOSED',
    "boardingOpenedAt" TIMESTAMP WITH TIME ZONE,
    "boardingClosesAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "bookingId" VARCHAR(255) UNIQUE NOT NULL,
    "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "tripId" UUID REFERENCES agent_trips(id) ON DELETE CASCADE,
    seats INTEGER DEFAULT 1,
    "pricePaid" NUMERIC(10,2) NOT NULL,
    "paymentStatus" VARCHAR(50) DEFAULT 'Paid',
    "boardingStatus" VARCHAR(50) DEFAULT 'Pending',
    "assignedSeat" VARCHAR(50) DEFAULT '',
    token TEXT UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DRIVER UPDATES TABLE
CREATE TABLE IF NOT EXISTS driver_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tripId" UUID REFERENCES agent_trips(id) ON DELETE CASCADE,
    "driverId" UUID REFERENCES drivers(id) ON DELETE CASCADE,
    "driverName" VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    "isDeleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ITINERARIES TABLE
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tripId" UUID REFERENCES agent_trips(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    "isAiSuggestion" BOOLEAN DEFAULT false,
    "aiSource" VARCHAR(100) DEFAULT '',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "bookingId" UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    "paymentMethod" VARCHAR(50) DEFAULT 'Razorpay',
    status VARCHAR(50) DEFAULT 'Paid',
    "transactionId" VARCHAR(255) UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CHECKLISTS TABLE
CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "tripId" UUID REFERENCES agent_trips(id) ON DELETE CASCADE,
    "itemName" VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    packed BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "tripId" UUID REFERENCES agent_trips(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) DEFAULT 'Admin User',
    email VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Super Admin',
    "twoFactorEnabled" BOOLEAN DEFAULT true,
    "twoFactorSecret" VARCHAR(255) DEFAULT NULL,
    "googleId" VARCHAR(255) DEFAULT NULL,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. PLANNER TRIPS TABLE
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    image TEXT DEFAULT '',
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    "startDate" VARCHAR(50),
    "endDate" VARCHAR(50),
    budget NUMERIC(10,2) DEFAULT 0.00,
    "isPublic" BOOLEAN DEFAULT false,
    "shareToken" VARCHAR(255) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'planning',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tripId" UUID REFERENCES trips(id) ON DELETE CASCADE,
    "totalBudget" NUMERIC(10,2) DEFAULT 0.00,
    "isArchived" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create default permissive policies for development/migration
CREATE POLICY "Permissive read/write users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write drivers" ON drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write agent_trips" ON agent_trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write driver_updates" ON driver_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write itineraries" ON itineraries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write checklists" ON checklists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write admins" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write trips" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissive read/write budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
