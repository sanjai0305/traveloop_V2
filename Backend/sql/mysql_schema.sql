-- ============================================================
-- Traveloop V2 MySQL Database Schema
-- Character Set: utf8mb4, Engine: InnoDB
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    is_verified TINYINT(1) DEFAULT 0,
    avatar TEXT,
    google_id VARCHAR(255),
    firebase_uid VARCHAR(255) UNIQUE,
    referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50),
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    rewards_points INT DEFAULT 0,
    referral_count INT DEFAULT 0,
    saved_destinations JSON,
    emergency_contacts JSON,
    preferences JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_firebase_uid (firebase_uid),
    INDEX idx_users_google_id (google_id),
    INDEX idx_users_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. AGENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(36) PRIMARY KEY,
    agency_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    owner_name VARCHAR(255),
    business_license VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    kyc_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    kyc_documents JSON,
    current_step INT DEFAULT 1,
    completed_steps JSON,
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    rating DECIMAL(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    profile_image TEXT,
    address TEXT,
    firebase_uid VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agents_email (email),
    INDEX idx_agents_status (status),
    INDEX idx_agents_firebase_uid (firebase_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. ADMINS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    permissions JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. DRIVERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    vehicle_number VARCHAR(100),
    vehicle_type VARCHAR(100),
    license_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'OFFLINE',
    assigned_trip_id VARCHAR(36),
    current_location JSON,
    rating DECIMAL(3,2) DEFAULT 5.00,
    firebase_uid VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_drivers_phone (phone),
    INDEX idx_drivers_firebase_uid (firebase_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. DRIVER OTPS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_otps (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(50) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_driver_otps_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. GENERAL OTPS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otps (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(50),
    otp VARCHAR(10) NOT NULL,
    type VARCHAR(50) DEFAULT 'VERIFICATION',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otps_email (email),
    INDEX idx_otps_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. AGENT TRIPS TABLE (Published Tour Packages)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_trips (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Group Package',
    theme VARCHAR(100) DEFAULT 'Nature',
    duration_days INT DEFAULT 1,
    duration_nights INT DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    price_per_person DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    discount_percentage INT DEFAULT 0,
    available_slots INT DEFAULT 20,
    total_slots INT DEFAULT 20,
    status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
    approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
    is_published TINYINT(1) DEFAULT 0,
    visible_to_travelers TINYINT(1) DEFAULT 0,
    published_at DATETIME,
    images JSON,
    thumbnail TEXT,
    itinerary JSON,
    pickup_points JSON,
    pickup_location VARCHAR(255),
    inclusions JSON,
    exclusions JSON,
    terms_conditions TEXT,
    bus_type VARCHAR(100),
    bus_amenities JSON,
    hotel_name VARCHAR(255),
    hotel_rating DECIMAL(3,2),
    hotel_amenities JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent_trips_agent_id (agent_id),
    INDEX idx_agent_trips_destination (destination),
    INDEX idx_agent_trips_status (status),
    CONSTRAINT fk_agent_trips_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. USER TRIPS TABLE (Collaborative Itineraries)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    user_id VARCHAR(36) NOT NULL,
    members JSON,
    budget_total DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    cover_image TEXT,
    status VARCHAR(50) DEFAULT 'PLANNED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_trips_user_id (user_id),
    CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. BOOKINGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_code VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    agent_trip_id VARCHAR(36),
    agent_id VARCHAR(36),
    passenger_count INT DEFAULT 1,
    passengers JSON,
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    final_amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    booking_status VARCHAR(50) DEFAULT 'CONFIRMED',
    payment_method VARCHAR(50) DEFAULT 'ONLINE',
    pickup_point JSON,
    seats JSON,
    qr_code_url TEXT,
    cancellation_reason TEXT,
    cancelled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bookings_user_id (user_id),
    INDEX idx_bookings_agent_id (agent_id),
    INDEX idx_bookings_agent_trip_id (agent_trip_id),
    INDEX idx_bookings_code (booking_code),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. PASSENGERS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passengers (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(50),
    seat_number VARCHAR(20),
    boarding_status VARCHAR(50) DEFAULT 'NOT_BOARDED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_passengers_booking_id (booking_id),
    CONSTRAINT fk_passengers_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. PAYMENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'CREATED',
    method VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payments_booking_id (booking_id),
    INDEX idx_payments_order_id (razorpay_order_id),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. BUDGETS & EXPENSES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    total_budget DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    categories JSON,
    expenses JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_budgets_trip_id (trip_id),
    INDEX idx_budgets_user_id (user_id),
    CONSTRAINT fk_budgets_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. CHECKLISTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklists (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    items JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_checklists_trip_id (trip_id),
    INDEX idx_checklists_user_id (user_id),
    CONSTRAINT fk_checklists_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_checklists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 14. NOTES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notes_trip_id (trip_id),
    INDEX idx_notes_user_id (user_id),
    CONSTRAINT fk_notes_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. JOURNALS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journals (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    day INT DEFAULT 1,
    date VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    entry TEXT NOT NULL,
    photos JSON,
    location VARCHAR(255),
    mood VARCHAR(50),
    highlights JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_journals_trip_id (trip_id),
    INDEX idx_journals_user_id (user_id),
    CONSTRAINT fk_journals_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_journals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. CHAT MESSAGES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    sender_name VARCHAR(255),
    sender_avatar TEXT,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'TEXT',
    media_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_messages_trip_id (trip_id),
    INDEX idx_chat_messages_sender_id (sender_id),
    CONSTRAINT fk_chat_messages_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. CHAT READ STATUSES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_read_statuses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    last_read_message_id VARCHAR(36),
    lastSeenAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    unread_count INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_chat_read (trip_id, user_id),
    INDEX idx_chat_read_user_id (user_id),
    CONSTRAINT fk_chat_read_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_read_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 18. BOARDING PASSES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boarding_passes (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    passenger_id VARCHAR(36),
    pass_code VARCHAR(100) NOT NULL UNIQUE,
    seat_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    qr_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_boarding_passes_booking_id (booking_id),
    CONSTRAINT fk_boarding_passes_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 19. SEAT BOOKINGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seat_bookings (
    id VARCHAR(36) PRIMARY KEY,
    agent_trip_id VARCHAR(36) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    booking_id VARCHAR(36) NOT NULL,
    passenger_gender VARCHAR(20),
    status VARCHAR(50) DEFAULT 'BOOKED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_seat_bookings_trip (agent_trip_id),
    INDEX idx_seat_bookings_seat (agent_trip_id, seat_number),
    CONSTRAINT fk_seat_bookings_trip FOREIGN KEY (agent_trip_id) REFERENCES agent_trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_seat_bookings_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 20. SEATS MASTER TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36),
    bus_type VARCHAR(100) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    row_num INT,
    col_num INT,
    tier VARCHAR(50) DEFAULT 'STANDARD',
    INDEX idx_seats_trip (trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 21. MASTER TABLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bus_amenities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hotel_amenities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trip_activities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 22. COUPONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    discount_type VARCHAR(50) DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(12,2) NOT NULL,
    min_order_value DECIMAL(12,2) DEFAULT 0.00,
    max_discount_amount DECIMAL(12,2),
    usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    expires_at DATETIME,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coupons_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 23. REWARDS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    points INT DEFAULT 0,
    history JSON,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rewards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 24. REFERRALS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
    id VARCHAR(36) PRIMARY KEY,
    referrer_id VARCHAR(36) NOT NULL,
    referee_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    reward_amount DECIMAL(12,2) DEFAULT 50.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_referrals_referrer (referrer_id),
    INDEX idx_referrals_referee (referee_id),
    CONSTRAINT fk_referrals_referrer FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_referrals_referee FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 25. AGENT REFERRALS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_referrals (
    id VARCHAR(36) PRIMARY KEY,
    referrer_agent_id VARCHAR(36) NOT NULL,
    referee_agent_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    commission_earned DECIMAL(12,2) DEFAULT 100.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agent_referrals_referrer FOREIGN KEY (referrer_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    CONSTRAINT fk_agent_referrals_referee FOREIGN KEY (referee_agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 26. REVIEWS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36),
    agent_trip_id VARCHAR(36),
    rating INT,
    comment TEXT,
    status VARCHAR(50) DEFAULT 'APPROVED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reviews_trip (agent_trip_id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 27. NOTIFICATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    userId VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    `read` TINYINT(1) DEFAULT 0,
    data JSON,
    tripId VARCHAR(36),
    isInvite TINYINT(1) DEFAULT 0,
    inviteStatus VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_id (user_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 28. ADMIN NOTIFICATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_notifications (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'ALERT',
    `read` TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 29. ACTIVITY LOGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36),
    actor_role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details JSON,
    tripId VARCHAR(36),
    userId VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 30. SETTLEMENTS & WITHDRAWALS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settlements (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PROCESSED',
    reference_id VARCHAR(255),
    bookingId VARCHAR(36),
    tripId VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_settlements_agent (agent_id),
    CONSTRAINT fk_settlements_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    bank_details JSON,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_withdrawals_agent (agent_id),
    CONSTRAINT fk_withdrawals_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 31. LEGAL DOCUMENTS & ACCEPTANCE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_documents (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(50) DEFAULT '2026-07',
    content TEXT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legal_acceptance (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    agent_id VARCHAR(36),
    document_id VARCHAR(36) NOT NULL,
    version VARCHAR(50) DEFAULT '2026-07',
    accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 32. TRAVEL INTENTS TABLE (AI Demand Intelligence)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS travel_intents (
    id VARCHAR(36) PRIMARY KEY,
    intent_id VARCHAR(255) UNIQUE,
    destination VARCHAR(255),
    budget VARCHAR(255),
    duration VARCHAR(255),
    theme VARCHAR(255),
    group_type VARCHAR(255),
    source VARCHAR(100) DEFAULT 'chatbot',
    user_id VARCHAR(255),
    user_ids JSON,
    users_waiting INT DEFAULT 1,
    intent_count INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_travel_intents_dest (destination),
    INDEX idx_travel_intents_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 33. CHAT HISTORY TABLE (AI Long-term Memory)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_history_user (user_id),
    INDEX idx_chat_history_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 34. RECOMMENDATIONS TABLE (AI Recommendations Cache)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    trip_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    destination VARCHAR(255),
    score DECIMAL(5,4),
    reason TEXT,
    thumbnail TEXT,
    price VARCHAR(100),
    duration VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recommendations_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 35. USER PROFILES TABLE (AI Personalization)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    preferred_destinations JSON,
    preferred_themes JSON,
    preferred_budget JSON,
    preferred_duration JSON,
    preferred_seasons JSON,
    preferred_group_type JSON,
    favourite_activities JSON,
    frequently_viewed_trips JSON,
    bookmarked_trips JSON,
    booked_trips JSON,
    frequently_searched_destinations JSON,
    preferences JSON,
    profile_embedding JSON,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_profiles_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 36. USER PREFERENCES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    preferences JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 37. CHAT ANALYTICS & DAILY STATS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_analytics (
    id VARCHAR(36) PRIMARY KEY,
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
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_analytics_dest (destination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_statistics (
    id VARCHAR(36) PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_queries INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 38. TRAVELER SEARCH INTENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS traveler_search_intents (
    id VARCHAR(36) PRIMARY KEY,
    intent_id VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    query TEXT,
    query_embedding JSON,
    destination VARCHAR(255),
    budget VARCHAR(255),
    duration VARCHAR(255),
    theme VARCHAR(255),
    travel_month VARCHAR(255),
    group_size VARCHAR(255),
    group_type VARCHAR(255),
    intent VARCHAR(255),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 39. FLIGHTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flights (
    id VARCHAR(36) PRIMARY KEY,
    tripId VARCHAR(36),
    airline VARCHAR(255),
    flightNumber VARCHAR(50),
    departureAirport VARCHAR(100),
    arrivalAirport VARCHAR(100),
    departureTime DATETIME,
    arrivalTime DATETIME,
    status VARCHAR(50) DEFAULT 'Scheduled',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_flights_tripId (tripId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 40. SYSTEM SETTINGS, COMMISSIONS & EXCHANGE RATES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_rate_caches (
    id VARCHAR(36) PRIMARY KEY,
    baseCurrency VARCHAR(10) NOT NULL UNIQUE,
    rates JSON,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(36) PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL UNIQUE,
    value JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commissions (
    id VARCHAR(36) PRIMARY KEY,
    defaultRate DECIMAL(5,2) DEFAULT 10.00,
    updatedBy VARCHAR(36),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 41. UPLOADED_FILES TABLE (AWS S3 Storage Registry)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uploaded_files (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36),
    entity_type VARCHAR(50) DEFAULT 'general',
    entity_id VARCHAR(36),
    original_filename VARCHAR(255) NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 's3',
    bucket_name VARCHAR(255) NOT NULL,
    object_key VARCHAR(500) NOT NULL UNIQUE,
    mime_type VARCHAR(100),
    file_size BIGINT DEFAULT 0,
    visibility ENUM('public', 'private') DEFAULT 'public',
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_files_owner (owner_id),
    INDEX idx_files_entity (entity_type, entity_id),
    INDEX idx_files_visibility (visibility),
    INDEX idx_files_object_key (object_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
