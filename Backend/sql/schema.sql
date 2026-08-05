-- ============================================================
-- Traveloop V2 PostgreSQL Database Schema for Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    avatar TEXT,
    google_id VARCHAR(255),
    referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50),
    wallet_balance NUMERIC(12,2) DEFAULT 0.00,
    rewards_points INT DEFAULT 0,
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- ------------------------------------------------------------
-- 2. AGENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    owner_name VARCHAR(255),
    business_license VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    kyc_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    kyc_documents JSONB DEFAULT '{}'::jsonb,
    current_step INT DEFAULT 1,
    completed_steps INT[] DEFAULT ARRAY[]::INT[],
    wallet_balance NUMERIC(12,2) DEFAULT 0.00,
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    rating NUMERIC(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    profile_image TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_email ON public.agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);

-- ------------------------------------------------------------
-- 3. ADMINS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 4. DRIVERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    vehicle_number VARCHAR(100),
    vehicle_type VARCHAR(100),
    license_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'OFFLINE',
    assigned_trip_id UUID,
    current_location JSONB DEFAULT '{}'::jsonb,
    rating NUMERIC(3,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 5. DRIVER OTPS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.driver_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(50) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. GENERAL OTPS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    phone VARCHAR(50),
    otp VARCHAR(10) NOT NULL,
    type VARCHAR(50) DEFAULT 'VERIFICATION',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 7. AGENT TRIPS TABLE (Published Packages)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Group Package',
    theme VARCHAR(100) DEFAULT 'Nature',
    duration_days INT DEFAULT 1,
    duration_nights INT DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    price_per_person NUMERIC(12,2) NOT NULL,
    original_price NUMERIC(12,2),
    discount_percentage INT DEFAULT 0,
    available_slots INT DEFAULT 20,
    total_slots INT DEFAULT 20,
    status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
    approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
    is_published BOOLEAN DEFAULT false,
    visible_to_travelers BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    thumbnail TEXT,
    itinerary JSONB DEFAULT '[]'::jsonb,
    pickup_points JSONB DEFAULT '[]'::jsonb,
    inclusions TEXT[] DEFAULT ARRAY[]::TEXT[],
    exclusions TEXT[] DEFAULT ARRAY[]::TEXT[],
    terms_conditions TEXT,
    bus_type VARCHAR(100),
    bus_amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    hotel_name VARCHAR(255),
    hotel_rating NUMERIC(3,2),
    hotel_amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_trips_destination ON public.agent_trips(destination);
CREATE INDEX IF NOT EXISTS idx_agent_trips_agent_id ON public.agent_trips(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_trips_status ON public.agent_trips(status);

-- ------------------------------------------------------------
-- 8. USER TRIPS TABLE (Collaborative Itineraries)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    members JSONB DEFAULT '[]'::jsonb,
    budget_total NUMERIC(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    cover_image TEXT,
    status VARCHAR(50) DEFAULT 'PLANNED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 9. BOOKINGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_trip_id UUID REFERENCES public.agent_trips(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    passenger_count INT DEFAULT 1,
    passengers JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    final_amount NUMERIC(12,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    booking_status VARCHAR(50) DEFAULT 'CONFIRMED',
    payment_method VARCHAR(50) DEFAULT 'ONLINE',
    pickup_point JSONB DEFAULT '{}'::jsonb,
    seats JSONB DEFAULT '[]'::jsonb,
    qr_code_url TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON public.bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON public.bookings(booking_code);

-- ------------------------------------------------------------
-- 10. PASSENGERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(50),
    seat_number VARCHAR(20),
    boarding_status VARCHAR(50) DEFAULT 'NOT_BOARDED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 11. PAYMENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'CREATED',
    method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 12. BUDGETS & EXPENSES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    total_budget NUMERIC(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    categories JSONB DEFAULT '{}'::jsonb,
    expenses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 13. CHECKLISTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 14. NOTES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 15. JOURNALS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    entry TEXT NOT NULL,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    location VARCHAR(255),
    mood VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 16. CHAT MESSAGES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255),
    sender_avatar TEXT,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'TEXT',
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 17. CHAT READ STATUSES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_read_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    last_read_message_id UUID,
    unread_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 18. BOARDING PASSES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.boarding_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES public.passengers(id) ON DELETE CASCADE,
    pass_code VARCHAR(100) UNIQUE NOT NULL,
    seat_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 19. SEAT BOOKINGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seat_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_trip_id UUID REFERENCES public.agent_trips(id) ON DELETE CASCADE,
    seat_number VARCHAR(20) NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    passenger_gender VARCHAR(20),
    status VARCHAR(50) DEFAULT 'BOOKED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 20. SEATS MASTER TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_type VARCHAR(100) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    row_num INT,
    col_num INT,
    tier VARCHAR(50) DEFAULT 'STANDARD'
);

-- ------------------------------------------------------------
-- 21. MASTER TABLES (BUS TYPES, AMENITIES, ACTIVITIES)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bus_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bus_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hotel_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trip_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

-- ------------------------------------------------------------
-- 22. COUPONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    discount_type VARCHAR(50) DEFAULT 'PERCENTAGE',
    discount_value NUMERIC(12,2) NOT NULL,
    min_order_value NUMERIC(12,2) DEFAULT 0.00,
    max_discount_amount NUMERIC(12,2),
    usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 23. REWARDS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    points INT DEFAULT 0,
    history JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 24. REFERRALS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    reward_amount NUMERIC(12,2) DEFAULT 50.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 25. AGENT REFERRALS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    referee_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    commission_earned NUMERIC(12,2) DEFAULT 100.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 26. REVIEWS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    agent_trip_id UUID REFERENCES public.agent_trips(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 27. NOTIFICATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 28. ADMIN NOTIFICATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'ALERT',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 29. ACTIVITY LOGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 30. SETTLEMENTS & WITHDRAWALS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PROCESSED',
    reference_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    bank_details JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 32. LEGAL DOCUMENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '2026-07',
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 33. LEGAL ACCEPTANCE TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legal_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL DEFAULT '2026-07',
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 34. TRAVEL INTENTS TABLE (AI Service Demand)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.travel_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id VARCHAR(255) UNIQUE,
    destination VARCHAR(255),
    budget VARCHAR(255),
    duration VARCHAR(255),
    theme VARCHAR(255),
    group_type VARCHAR(255),
    source VARCHAR(100) DEFAULT 'chatbot',
    user_id VARCHAR(255),
    user_ids JSONB DEFAULT '[]'::jsonb,
    users_waiting INT DEFAULT 1,
    intent_count INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 35. CHAT HISTORY TABLE (AI Service Memory)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 36. RECOMMENDATIONS TABLE (AI Service Recommendations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    trip_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    destination VARCHAR(255),
    score NUMERIC(5,4),
    reason TEXT,
    thumbnail TEXT,
    price VARCHAR(100),
    duration VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 37. USER PROFILES TABLE (AI Service Personalization)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    preferred_destinations JSONB DEFAULT '[]'::jsonb,
    preferred_themes JSONB DEFAULT '[]'::jsonb,
    preferred_budget JSONB DEFAULT '[]'::jsonb,
    preferred_duration JSONB DEFAULT '[]'::jsonb,
    preferred_seasons JSONB DEFAULT '[]'::jsonb,
    preferred_group_type JSONB DEFAULT '[]'::jsonb,
    favourite_activities JSONB DEFAULT '[]'::jsonb,
    frequently_viewed_trips JSONB DEFAULT '[]'::jsonb,
    bookmarked_trips JSONB DEFAULT '[]'::jsonb,
    booked_trips JSONB DEFAULT '[]'::jsonb,
    frequently_searched_destinations JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '[]'::jsonb,
    profile_embedding JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 38. USER PREFERENCES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    preferences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 39. CHAT ANALYTICS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    destination VARCHAR(255),
    budget VARCHAR(255),
    duration VARCHAR(255),
    theme VARCHAR(255),
    season VARCHAR(255),
    companions VARCHAR(255),
    group_type VARCHAR(255),
    intent VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 40. DAILY STATISTICS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    total_queries INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 41. TRAVELER SEARCH INTENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.traveler_search_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    query TEXT,
    query_embedding JSONB,
    destination VARCHAR(255),
    budget VARCHAR(255),
    duration VARCHAR(255),
    theme VARCHAR(255),
    travel_month VARCHAR(255),
    group_size VARCHAR(255),
    group_type VARCHAR(255),
    intent VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_trips ENABLE ROW LEVEL SECURITY;

-- Allow service role full access policies
CREATE POLICY service_role_all ON public.users FOR ALL USING (true);
CREATE POLICY service_role_all ON public.agents FOR ALL USING (true);
CREATE POLICY service_role_all ON public.bookings FOR ALL USING (true);
CREATE POLICY service_role_all ON public.agent_trips FOR ALL USING (true);


