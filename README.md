# 🌍 Traveloop V2 — AI-Powered Travel Planning & Intelligent Booking Ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1.svg)](https://www.mysql.com/)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-DC2626.svg)](https://qdrant.tech/)
[![Redis](https://img.shields.io/badge/Cache-Redis_7-DC382D.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose_v2-2496ED.svg)](https://www.docker.com/)

---

## 📖 Table of Contents

1. [Project Overview](#-1-project-overview)
2. [Problem Statement & Objectives](#-2-problem-statement--objectives)
3. [Key Features Breakdown](#-3-key-features-breakdown)
4. [Verified Technology Stack](#-4-verified-technology-stack)
5. [System Architecture Diagram](#-5-system-architecture-diagram)
6. [Project Folder Structure](#-6-project-folder-structure)
7. [Application Workflow & Data Flow](#-7-application-workflow--data-flow)
8. [Prerequisites](#-8-prerequisites)
9. [Installation & Setup Instructions](#-9-installation--setup-instructions)
10. [Environment Variable Configuration](#-10-environment-variable-configuration)
11. [Database Setup, Migrations & Seeding](#-11-database-setup-migrations--seeding)
12. [Frontend Execution Commands](#-12-frontend-execution-commands)
13. [Backend & AI Service Execution Commands](#-13-backend--ai-service-execution-commands)
14. [API Documentation & Important Endpoints](#-14-api-documentation--important-endpoints)
15. [Authentication & User Roles](#-15-authentication--user-roles)
16. [Testing & Quality Verification](#-16-testing--quality-verification)
17. [Production Build & Deployment](#-17-production-build--deployment)
18. [Security & Governance Considerations](#-18-security--governance-considerations)
19. [Troubleshooting Guide](#-19-troubleshooting-guide)
20. [Current Limitations & Known Issues](#-20-current-limitations--known-issues)
21. [Future Enhancements & Roadmap](#-21-future-enhancements--roadmap)
22. [Contribution Guidelines](#-22-contribution-guidelines)
23. [License](#-23-license)

---

## 🌟 1. Project Overview

**Traveloop V2** is an enterprise-grade, multi-tenant travel planning, tour operator marketplace, and real-time transit orchestration platform. Built around a micro-frontend and distributed services architecture, Traveloop unites four core stakeholders within a single synchronized ecosystem:

1. **Travelers (`user-website`)**: Plan personalized itineraries, discover published tour packages, reserve bus seats interactively, split budgets, access packing checklists, track travel journals, chat collaboratively with trip members in real time, and hold dynamic QR boarding passes.
2. **Travel Agencies (`agent-portal`)**: Manage end-to-end tour operations, publish multi-day group tour packages, configure custom bus seat layouts, review KYC compliance documents, verify passenger manifests, manage bookings, and analyze market demand through AI intelligence.
3. **Bus Drivers & Transit Coordinators (`driver-portal`)**: View live trip departures, access verified passenger manifests, scan digital QR boarding passes on the road with device cameras, track passenger boarding states, and broadcast real-time delay or departure alerts.
4. **Platform Administrators (`admin-portal`)**: Oversee agency KYC onboarding, approve tour packages, manage platform commissions, track financial settlements and payouts, inspect audit logs, and configure system-wide settings.

The backend infrastructure is powered by an **Express.js API Gateway** connected to **MySQL 8.0** via `mysql2/promise`, an autonomous **FastAPI AI Microservice** leveraging **SQLAlchemy 2.x / PyMySQL**, **Google Gemini**, and **Qdrant Vector DB** for Retrieval-Augmented Generation (RAG), and a **Redis** layer for short-term conversational memory and seat locks.

---

## 🎯 2. Problem Statement & Objectives

### The Problem
Traditional travel management suffers from severe operational fragmentation:
- **Disjointed Traveler Experience**: Travelers plan trips across scattered apps (spreadsheets for budgeting, WhatsApp for group chat, email for tickets, external apps for weather and packing).
- **Agency Operational Blindness**: Tour operators lack real-time visibility into customer demand trends, face manual KYC and payment friction, and struggle with manual seat reservation allocation.
- **Transit Verification Bottlenecks**: Drivers still rely on paper manifests or static screenshots, leading to boarding bottlenecks, ticket fraud, and zero real-time communication during transit delays.
- **Platform Governance Risks**: Travel aggregators lack unified audit trails, automated commission calculations, and real-time passenger verification tools.

### Objectives of Traveloop V2
- **Unified Collaborative Trip Planning**: Enable real-time multi-user itinerary authoring, expense splitting, and group discussion via WebSocket synchronization.
- **Autonomous AI Travel Intelligence**: Implement vector-embedded semantic search (RAG) and memory-aware conversational travel planning powered by Google Gemini and Qdrant.
- **End-to-End Digital Boarding Lifecycle**: Provide cryptographic QR code ticket generation, bus seat maps, and camera-based boarding validation for transit drivers.
- **Granular Multi-Tenant Portals**: Deliver dedicated, optimized interfaces tailored specifically for travelers, operators, drivers, and platform admins.
- **Scalable Cloud-Native Foundation**: Support containerized deployment via Docker Compose, multi-stage Alpine Nginx builds, and production automated EC2 deployments with PM2.

---

## ⚡ 3. Key Features Breakdown

### ✅ Implemented and Verified Features

| Module | Feature | Implementation Details | Supporting Stack Layer |
|---|---|---|---|
| **AI Travel Assistant** | Memory-Aware Conversational Chat | Multi-turn travel assistant with 30-message short-term memory window in Redis and long-term history persisted in MySQL | `ai-service` (FastAPI, Redis, Gemini Flash, MySQL) |
| **Semantic Discovery** | Semantic Trip RAG Search | Vector-based retrieval of package trips using `BAAI/bge-small-en-v1.5` embeddings (384-d) against Qdrant collection `trip_vectors` | `ai-service` (Qdrant, SentenceTransformers, LangChain) |
| **Market Intelligence** | Travel Demand Extraction | Automatic extraction of destinations, budgets, and group preferences from user chat conversations to inform agencies of travel demand | `ai-service` (FastAPI, Gemini, MySQL `travel_intents`) |
| **Marketplace** | Tour Package Management | Creation, multi-step itinerary composition, inclusions/exclusions, pricing, and slots publishing for travel agencies | `agent-portal` + `Backend` (`agent_trips` table) |
| **Interactive Transit** | Visual Bus Seat Layout & Booking | Dynamic grid generation based on coach type (AC Sleeper, Volvo, Semi-Sleeper), interactive seat selection, and conflict reservation checks | `user-website`, `agent-portal`, `Backend` (`seatRoutes.js`) |
| **Digital Boarding** | Dynamic QR Code Boarding Passes | QR generation for bookings, downloadable passes, and driver camera scanning using `html5-qrcode` | `driver-portal`, `user-website`, `Backend` (`boardingRoutes.js`) |
| **Driver Operations** | Live Manifest & Boarding Validation | Real-time passenger list, instant QR verification, status updates (`BOARDED` / `NOT_BOARDED`), and departure announcements | `driver-portal`, `Backend` (`driverRoutes.js`) |
| **Agency KYC** | Multi-Step Agency Onboarding | 5-step registration with business license, document upload via AWS S3 / Multer, and admin verification workflow | `agent-portal`, `admin-portal`, `Backend` (`agentRoutes.js`) |
| **Admin Governance** | Platform Admin Dashboard | Agency approvals, commission rate controls, package approval/rejection, financial settlements, and audit activity logging | `admin-portal`, `Backend` (`adminRoutes.js`) |
| **Real-Time Engine** | Group Collaboration & Chat | Real-time Socket.io rooms per trip, live typing indicators, instant messaging, user presence tracking, and notification dispatches | `user-website`, `Backend` (`server.js`, Socket.io) |
| **Travel Utility** | Multi-Currency Budgeting & Split | Dynamic expense categorization, total recalculation, and member expense tracking | `user-website`, `Backend` (`budgetRoutes.js`, `budgets` table) |
| **Travel Utility** | Packing Checklist & Notes | Shared and categorized packing checklist items and freeform trip documentation | `user-website`, `Backend` (`checklistRoutes.js`, `notesRoutes.js`) |
| **Travel Utility** | Destination Visa Guide | Country and nationality entry requirements, passport validity guidelines, and e-visa rules | `user-website`, `Backend` (`visaRoutes.js`, `visaData.js`) |
| **Weather** | Real-Time Forecast & Advisories | Open-Meteo integration mapping WMO weather codes to safety alerts and 7-day temperature forecasts | `user-website`, `Backend` (`weatherRoutes.js`) |
| **Referrals & Rewards**| Referral Tracking & Gamification | Alphanumeric referral code generation, invite linking, reward points, and discount coupon applications | `Backend` (`referralRoutes.js`, `couponRoutes.js`) |

### ⚠️ Partially Implemented / Stubs

- **Flight Status Tracking (`flightController.js`)**: Endpoints exist (`/api/flights/create`, `/api/flights/trip/:tripId`, `/api/flights/:id/refresh`) and AviationStack environment variables are declared, but the controller returns mock data structures pending live flight API hookup.
- **Receipt OCR Scanning (`expenseScannerController.js`)**: `tesseract.js` dependency is installed in `package.json`, but the route `/api/scanner/scan` currently responds with a pre-formatted stub extraction payload.
- **Message Reactions & Message Editing (`chatController.js`)**: Live text messages and read receipts are fully synchronized via Socket.io and stored in MySQL, but the secondary HTTP endpoints `reactToMessage` and `editMessage` return stub responses.
- **Razorpay Live Gateway (`paymentRoutes.js`)**: Complete order generation and HMAC-SHA256 signature verification logic is implemented; falls back gracefully to synthetic test orders when test keys (`rzp_test_dummykeyid`) are in use.

### 🔮 Planned / Future Features
- Autonomous trip re-routing based on live severe weather alerts.
- Live GPS telemetry streaming from driver devices directly into the traveler trip view.
- In-app group voice and video coordination rooms.

---

## 💻 4. Verified Technology Stack

| Layer | Technology | Verified Version | Purpose & Where Used | Status |
|---|---|---|---|---|
| **Frontend Framework** | React | `^19.2.7` | Powers all 4 client applications (`user-website`, `admin-portal`, `agent-portal`, `driver-portal`) | Confirmed |
| **Build Tool** | Vite | `^8.0.10` / `^8.1.0` | High-speed frontend bundling, HMR, and build orchestration | Confirmed |
| **Language (Frontends)**| TypeScript | `~5.7.2` / `~6.0.2` | Strong type checking across `admin-portal`, `agent-portal`, and `driver-portal` | Confirmed |
| **Language (User Web)** | JavaScript (ESM) | ES2022 | Powers `user-website` components, hooks, and views | Confirmed |
| **UI Styling** | TailwindCSS | `^3.4.3` | Responsive utility-first design system across all 4 web portals | Confirmed |
| **Motion & UI** | Framer Motion | `^12.43.0` / `^11.11.9`| Micro-interactions, animated modal transitions, and dashboard widgets | Confirmed |
| **Icons** | Lucide React | `^1.14.0` / `^1.21.0` | Comprehensive icon kit across all web portals | Confirmed |
| **State Management** | Zustand | `^5.0.3` / `^5.0.14` | Global state stores in `admin-portal`, `agent-portal`, and `driver-portal` | Confirmed |
| **Server State** | TanStack React Query | `^5.66.0` | Asynchronous query caching and mutation states in admin and agent portals | Confirmed |
| **Forms** | React Hook Form | `^7.54.2` | High-performance form state validation in admin and agent portals | Confirmed |
| **Barcode / QR** | html5-qrcode & qrcode.react | `^2.3.8` / `^4.2.0` | Hardware camera QR scanner in `driver-portal`; QR canvas generator in `user-website` | Confirmed |
| **Internationalization**| i18next & react-i18next| `^24.2.0` / `^15.4.0`| Multi-language localization support in `user-website` | Confirmed |
| **Backend Runtime** | Node.js | `>=20.0.0` (Alpine base) | Central Express API server executing `Backend/server.js` | Confirmed |
| **Backend Framework** | Express.js | `^4.21.2` | REST API gateway, rate limiting, and route middleware handling | Confirmed |
| **Real-Time Sockets** | Socket.io | `^4.8.1` (server) / `^4.8.3` (client) | WebSocket server for trip updates, seat reservations, typing, and notifications | Confirmed |
| **Primary Database** | MySQL 8.0 | `^3.24.5` (`mysql2/promise`) / `SQLAlchemy 2.x` | Primary relational database hosting 48 tables (InnoDB, utf8mb4) | Confirmed |
| **AI Microservice** | FastAPI | `0.110+` | Python service hosting endpoints for chat, search, embeddings, and analytics | Confirmed |
| **ASGI Server** | Uvicorn | `0.28+` | High-throughput asynchronous web server running FastAPI | Confirmed |
| **AI LLM Engine** | Google Gemini Flash | `gemini-flash-latest` (`google-generativeai`) | Generative travel planning, RAG response synthesis, and user preference extraction | Confirmed |
| **Embeddings** | HuggingFace SentenceTransformers | `BAAI/bge-small-en-v1.5` | 384-dimensional dense vector embeddings for trip packages and traveler profiles | Confirmed |
| **Vector Database** | Qdrant | `latest` (`qdrant-client`) | Vector database hosting `trip_vectors` and `user_profiles` collections | Confirmed |
| **In-Memory Cache** | Redis | `7-alpine` (`redis[hiredis]`) | Conversational memory buffers, seat locks, and dashboard aggregation caches | Confirmed |
| **Payments** | Razorpay SDK | `^2.9.6` | Order generation and webhook payment signature verification | Confirmed |
| **Client Auth & Push** | Firebase / Firebase Admin | `^12.14.0` / `^10.3.0` | Google OAuth, Phone OTP verification, and JWT cross-verification | Confirmed |
| **Document Export** | PDFKit & jsPDF | `^0.18.0` / `^2.5.2` | Server and client generation of booking receipts and boarding pass PDFs | Confirmed |
| **Cloud Storage** | AWS S3 / CloudFront | `@aws-sdk/client-s3` `^3.1149.0` | Secure object storage for media, KYC documents, avatars, and attachments | Confirmed |
| **Reverse Proxy** | Nginx | `1.27-alpine` | Multi-tenant reverse proxy and static distribution server | Confirmed |
| **Containerization** | Docker & Docker Compose | Compose file `3.9` | Multi-container composition of 7 services, health checks, and bridge networking | Confirmed |
| **CI/CD & Process Mgr**| GitHub Actions & PM2 | `appleboy/ssh-action@v1.2.0` | Automated git deployment pipeline to AWS EC2 with PM2 process manager | Confirmed |

---

## 🏛️ 5. System Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Frontends (Micro-Portals)"]
        UW["Traveler Website (Port 3000)<br/>React 19 / Vite / Tailwind"]
        AP["Admin Portal (Port 3001)<br/>React 19 / TypeScript / Zustand"]
        AGP["Agent Portal (Port 3002)<br/>React 19 / TypeScript / Zustand"]
        DP["Driver Portal (Port 3003)<br/>React 19 / TypeScript / html5-qrcode"]
    end

    subgraph Ingress["Reverse Proxy & Gateway"]
        NGINX["Nginx Reverse Proxy (Port 80)<br/>Subdomain & Route Dispatcher"]
    end

    subgraph CoreBackend["Central Application Backend (Port 5000)"]
        EXPRESS["Express.js API Gateway<br/>Auth / Security / Rate Limits / Middleware"]
        SOCKET["Socket.io WebSocket Engine<br/>Live Rooms: trip_:id, user_:id"]
    end

    subgraph AIService["AI & Intelligence Microservice (Port 8000)"]
        FASTAPI["FastAPI Engine (Uvicorn)<br/>Chat / RAG / Demands / Analytics"]
        EMBED["SentenceTransformers<br/>BAAI/bge-small-en-v1.5 (384-d)"]
        GEMINI["Google Gemini API<br/>gemini-flash-latest"]
    end

    subgraph DataLayers["Persistence & Cache"]
        MYSQL[("MySQL 8.0 (Port 3306)<br/>48 Relational Tables (InnoDB)")]
        REDIS[("Redis 7 Cache<br/>Chat Memory & Seat Locks")]
        QDRANT[("Qdrant Vector DB (Port 6333)<br/>Collections: trip_vectors, user_profiles")]
    end

    subgraph ExternalServices["Third-Party Integrations"]
        FB["Firebase Admin (Auth / OTP)"]
        RZP["Razorpay (Payments & Orders)"]
        S3["AWS S3 & CloudFront (Media, KYC & Documents)"]
        MAIL["Nodemailer / Gmail OAuth2"]
        METEO["Open-Meteo Weather API"]
    end

    %% Client traffic
    UW --> NGINX
    AP --> NGINX
    AGP --> NGINX
    DP --> NGINX

    NGINX -->|/api/* & WebSockets| EXPRESS
    NGINX -->|Direct Frontends| UW
    NGINX -->|Direct Frontends| AP
    NGINX -->|Direct Frontends| AGP
    NGINX -->|Direct Frontends| DP

    %% Core Backend relationships
    EXPRESS <--> SOCKET
    EXPRESS -->|Proxy AI Requests /api/ai/*| FASTAPI
    EXPRESS -->|Relational Queries & Auth| MYSQL
    EXPRESS -->|Real-time Cache / Session| REDIS
    EXPRESS --> FB
    EXPRESS --> RZP
    EXPRESS --> CLD
    EXPRESS --> MAIL
    EXPRESS --> METEO

    %% AI Service internal & external flows
    FASTAPI --> EMBED
    FASTAPI --> GEMINI
    FASTAPI -->|Vector Similarity| QDRANT
    FASTAPI -->|Memory TTL & Cache| REDIS
    FASTAPI -->|History & Intent Persistence| MYSQL
```

---

## 📁 6. Project Folder Structure

```text
traveloop_V2/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD deploying backend to AWS EC2 via SSH & PM2
├── .dockerignore                   # Root Docker ignore rules
├── .env.example                    # Global root environment variable template
├── docker-compose.yml              # Production multi-service Docker Compose orchestration
├── LICENSE                         # Project MIT License (Copyright 2026 Sanjai M)
├── README.md                       # Comprehensive platform architectural documentation
│
├── Backend/                        # Central Node.js / Express API Server (Port 5000)
│   ├── config/                     # Service configs (MySQL pool, DB query abstraction, Firebase Admin, AWS S3)
│   ├── controllers/                # 18 business logic controllers (auth, trips, bookings, admin, ai, etc.)
│   ├── middleware/                 # 8 middlewares (auth, adminAuth, agentAuth, driverAuth, sanitize, rateLimit)
│   ├── routes/                     # 38 Express route modules mounting all REST endpoints
│   ├── services/                   # Business services (BookingService, aiService, paymentService, emailService)
│   ├── sql/
│   │   └── mysql_schema.sql        # MySQL 8.0 master schema (48 relational tables, InnoDB, utf8mb4)
│   ├── utils/                      # Helper utilities (bootstrapAdmin.js for auto-seeding super admin)
│   ├── Dockerfile                  # Multi-stage Node 20 Alpine container definition
│   └── server.js                   # Main application entry point, Socket.io initialization, & route registration
│
├── ai-service/                     # Python / FastAPI AI Microservice (Port 8000)
│   ├── app/
│   │   ├── api/                    # FastAPI routers (chat, search, embed, demands, analytics, recommendations)
│   │   ├── core/                   # Core connectors (database.py, gemini.py, qdrant.py, redis.py)
│   │   ├── models/                 # Pydantic validation schemas
│   │   ├── repositories/           # Data access repositories
│   │   └── services/               # RAG, embedding, memory, analytics, and intent extraction services
│   ├── Dockerfile                  # Python 3.11 Slim container definition
│   └── requirements.txt            # Python dependencies (FastAPI, LangChain, Qdrant, SentenceTransformers)
│
├── user-website/                   # Traveler Portal — Mobile-first Web Application (Port 3000)
│   ├── src/
│   │   ├── components/             # Reusable UI elements (itinerary cards, seat selection, modals, navbar)
│   │   ├── context/                # React contexts (AuthContext, SocketContext)
│   │   ├── pages/                  # 41 pages (Dashboard, BuildItinerary, BookedTrips, TripBudget, TripChat)
│   │   └── services/               # API clients for backend calls
│   └── Dockerfile                  # Vite build + Nginx static serving
│
├── admin-portal/                   # System Administration Dashboard (Port 3001)
│   ├── src/
│   │   ├── pages/                  # Dashboard, Agents, Trips, Bookings, Finance, Settings, Referrals
│   │   └── store/                  # Zustand stores for admin state management
│   └── Dockerfile                  # Multi-stage TypeScript build + Nginx serving
│
├── agent-portal/                   # Travel Agency Portal (Port 3002)
│   ├── src/
│   │   ├── pages/                  # Trips, Bookings, CompleteProfile (KYC), TravelDemandPage, Analytics
│   │   └── store/                  # Agency state and multi-step onboarding stores
│   └── Dockerfile                  # Multi-stage TypeScript build + Nginx serving
│
├── driver-portal/                  # Bus Driver Transit Portal (Port 3003)
│   ├── src/
│   │   ├── pages/                  # Dashboard, Manifest, Scanner (html5-qrcode), PassengerCard
│   │   └── context/                # Driver authentication and active trip context
│   └── Dockerfile                  # Multi-stage TypeScript build + Nginx serving
│
├── nginx/
│   └── nginx.conf                  # Nginx configuration for upstream reverse proxy and route mapping
│
└── project-resources/              # Project legacy migration logs, design notes, and audit references
```

---

## 🔄 7. Application Workflow & Data Flow

### 1. Traveler Journey (Discovery to Digital Boarding)
```mermaid
sequenceDiagram
    autonumber
    actor Traveler
    participant UW as User Website
    participant BE as Express Backend
    participant AI as AI Service
    participant DB as MySQL DB
    participant RZP as Razorpay

    Traveler->>UW: Enter travel query / request package
    UW->>BE: POST /api/ai/search or GET /api/trips/published
    BE->>AI: Vector Search (BAAI embeddings -> Qdrant)
    AI-->>BE: Top-K semantic package matches + intent extracted
    BE-->>UW: Display packages & itineraries
    Traveler->>UW: Select seats on interactive bus seat map
    UW->>BE: POST /api/bookings/create-order
    BE->>RZP: Generate Razorpay Order
    RZP-->>BE: Return order_id
    BE-->>UW: Open Razorpay Checkout Modal
    Traveler->>UW: Authorize Payment
    UW->>BE: POST /api/payments/verify
    BE->>DB: Update booking status CONFIRMED, assign seats
    BE-->>UW: Generate QR Code Boarding Pass
```

### 2. Transit Execution & Driver Boarding Validation
```mermaid
sequenceDiagram
    autonumber
    actor Driver
    participant DP as Driver Portal
    participant BE as Express Backend
    participant DB as MySQL DB
    participant Socket as Socket.io Server
    actor Traveler

    Driver->>DP: Login with Phone/Email OTP
    DP->>BE: GET /api/driver/my-trip
    BE->>DB: Fetch assigned trip & passengers
    BE-->>DP: Display passenger manifest
    Driver->>DP: Open camera scanner (html5-qrcode)
    Traveler->>Driver: Present digital boarding QR pass
    DP->>BE: POST /api/driver/scan-qr (token)
    BE->>DB: Validate booking & update boarding_status = 'BOARDED'
    BE->>Socket: Emit 'passenger_boarded' event
    Socket-->>Traveler: Push instant notification: "Boarding verified!"
    BE-->>DP: Sound success chime & update manifest count
```

### 3. Agency Package Publishing & Admin KYC Governance
```mermaid
sequenceDiagram
    autonumber
    actor Agent
    participant AGP as Agent Portal
    participant BE as Express Backend
    participant DB as MySQL DB
    participant AP as Admin Portal
    actor Admin

    Agent->>AGP: Complete 5-Step KYC (Business license, bank details, docs)
    AGP->>BE: POST /api/agent/profile/onboarding
    BE->>DB: Store agent in PENDING status
    Admin->>AP: Review pending agency in KYC queue
    Admin->>AP: Click "Approve Agency"
    AP->>BE: PATCH /api/admin/agents/:id/status (APPROVED)
    BE->>DB: Update agent status to APPROVED
    Agent->>AGP: Create & publish tour package with seat layout
    AGP->>BE: POST /api/agent/trips
    BE->>DB: Insert agent_trips (approval_status: PENDING_APPROVAL)
    Admin->>AP: Review package & approve
    AP->>BE: PATCH /api/admin/trips/:id/approve
    BE->>DB: Set is_published = true, approval_status = APPROVED
    BE-->>Agent: Package is now live on traveler marketplace
```

---

## 📋 8. Prerequisites

Ensure your host system meets the following minimum requirements before installing:

- **Docker & Docker Compose**: Docker Desktop (latest) or Docker Engine v24+ with Docker Compose v2.20+.
- **Node.js**: v20.x LTS or higher (with `npm` v10+).
- **Python**: v3.11 or v3.12 (for running `ai-service` locally outside Docker).
- **MySQL Database Server**: MySQL 8.0+ server installed locally or provisioned via Docker.
- **Git**: Installed and configured on your operating system.
- **Hardware Resources**: Minimum 4 CPU cores and 8 GB RAM (recommended for hosting Qdrant, Redis, AI model embeddings, and 4 web dev servers simultaneously).

---

## 🚀 9. Installation & Setup Instructions

### Option A: Complete Docker Compose Deployment (Recommended)

Running all 7 services in isolated, linked containers via Docker Compose:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/traveloop_v2.git
   cd traveloop_V2
   ```

2. **Configure Root and Service Environment Files:**
   ```bash
   # Copy root Docker build arguments
   cp .env.example .env

   # Copy backend environment configuration
   cp Backend/.env.example Backend/.env

   # Copy AI service environment configuration
   cp ai-service/.env.example ai-service/.env
   ```
   *(Ensure you populate valid credentials in `Backend/.env` and `ai-service/.env` as detailed in [Section 10](#-10-environment-variable-configuration)).*

3. **Build and Launch Containers:**
   ```bash
   docker compose up --build -d
   ```

4. **Verify Container Status:**
   ```bash
   docker compose ps
   ```

5. **Access Application Services:**
   - **Traveler Website:** [http://localhost:3000](http://localhost:3000)
   - **Admin Portal:** [http://localhost:3001](http://localhost:3001)
   - **Agent Portal:** [http://localhost:3002](http://localhost:3002)
   - **Driver Portal:** [http://localhost:3003](http://localhost:3003)
   - **Backend API Gateway:** [http://localhost:5000](http://localhost:5000)
   - **AI Service API & Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Qdrant Vector Dashboard:** [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

6. **Tear Down Application:**
   ```bash
   # Stop containers
   docker compose down

   # Stop and erase all persistent volumes (resets Redis & Qdrant data)
   docker compose down -v
   ```

---

### Option B: Local Native Development (Step-by-Step)

If you are developing components and wish to run each tier natively on your operating system:

#### 1. Start Supporting Containers (Redis & Qdrant)
```bash
docker run -d --name traveloop-redis -p 6379:6379 redis:7-alpine
docker run -d --name traveloop-qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

#### 2. Run the Express Backend
```bash
cd Backend
npm install
npm run dev
```
*The backend connects to MySQL, initializes Socket.io, and starts listening on port `5000`.*

#### 3. Run the AI Service
```bash
cd ai-service

# Create and activate Python virtual environment
python -m venv .venv

# Windows PowerShell:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

#### 4. Run the Frontend Portals (In Separate Terminals)
```bash
# Terminal A: Traveler Platform (Port 5173 / default Vite)
cd user-website && npm install && npm run dev

# Terminal B: Admin Portal (Port 5174)
cd admin-portal && npm install && npm run dev

# Terminal C: Agent Portal (Port 5175)
cd agent-portal && npm install && npm run dev

# Terminal D: Driver Portal (Port 5176)
cd driver-portal && npm install && npm run dev
```

---

## 🔐 10. Environment Variable Configuration

### 1. Root `.env` (Injected during Docker Builds)
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_yourkey
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 2. Backend Environment Variables (`Backend/.env`)
```env
# ── MySQL Database Configuration ──
DB_HOST=localhost
DB_PORT=3306
DB_NAME=traveloop
DB_USER=traveloop_app
DB_PASSWORD=your_secure_mysql_password
DB_SSL=false

# ── Firebase Admin Credentials ──
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...YOUR_KEY...\n-----END PRIVATE KEY-----\n"
FIREBASE_TEST_PHONE_NUMBER=+911234567890
FIREBASE_TEST_PHONE_OTP=123456

# ── Google & AI APIs ──
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_PLACES_API_KEY=your-google-places-api-key
GEMINI_API_KEY=your-gemini-api-key

# ── Payments (Razorpay) ──
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# ── AWS S3 Object Storage (Media & Documents) ──
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-unique-traveloop-bucket-name
AWS_CLOUDFRONT_DOMAIN=
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# ── Internal Service Interconnects ──
AI_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379

# ── Initial Admin Bootstrap (Creates Super Admin if table is empty) ──
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@traveloop.in
ADMIN_PASSWORD=YourStrongPasswordHere2026!

# ── Server Runtime ──
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_signing_key_traveloop_2026
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173
```

### 3. AI Service Environment Variables (`ai-service/.env`)
```env
# ── MySQL Database ──
DB_HOST=localhost
DB_PORT=3306
DB_NAME=traveloop
DB_USER=traveloop_app
DB_PASSWORD=your_secure_mysql_password
DB_SSL=false

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest

REDIS_URL=redis://localhost:6379/0
REDIS_MEMORY_TTL_SECONDS=86400
REDIS_MEMORY_MAX_MESSAGES=30

QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=trip_vectors
QDRANT_USER_PROFILE_COLLECTION_NAME=user_profiles
EMBEDDING_MODEL_NAME=BAAI/bge-small-en-v1.5

SEARCH_TOP_K=5
SEARCH_MIN_SCORE=0.65
RECOMMENDATION_TOP_K=10
```

---

## 🗄️ 11. Database Setup, Migrations & Seeding

Traveloop V2 utilizes **MySQL 8.0** as its single source of truth for all persistent relational data.

### Master Schema Setup
1. Create the MySQL database and user:
   ```sql
   CREATE DATABASE traveloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'traveloop_app'@'%' IDENTIFIED BY 'your_secure_mysql_password';
   GRANT ALL PRIVILEGES ON traveloop.* TO 'traveloop_app'@'%';
   FLUSH PRIVILEGES;
   ```
2. Import the complete master schema located at:
   [`Backend/sql/mysql_schema.sql`](file:///d:/travel/traveloop_V2/Backend/sql/mysql_schema.sql)
   ```bash
   mysql -u traveloop_app -p traveloop < Backend/sql/mysql_schema.sql
   ```
   *This initializes all 48 core relational tables with InnoDB engine, utf8mb4 charset, UUID primary keys, explicit foreign key constraints, indexes, and JSON attributes.*

### Automated Master Data Seeding
Upon startup, the Express backend automatically runs [`Backend/config/db.js`](file:///d:/travel/traveloop_V2/Backend/config/db.js). If master lookup tables are empty, it automatically populates:
- **Bus Types**: AC Sleeper, Semi Sleeper, Volvo, Mini Bus, Tempo Traveller
- **Bus Amenities**: WiFi, Charging, Blanket, Water Bottle, Recliner Seats, TV, Reading Light
- **Hotel Amenities**: Swimming Pool, WiFi, Gym, Breakfast, Parking, Spa, Private Beach
- **Trip Activities**: Beach Visit, Cruise, Temple Visit, Safari, Campfire, Scuba Diving, Trekking

### Super Admin Bootstrapping
On startup, [`Backend/utils/bootstrapAdmin.js`](file:///d:/travel/traveloop_V2/Backend/utils/bootstrapAdmin.js) checks if any administrative records exist in the `admins` table. If none exist, it creates the initial Super Admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` hashed with `bcryptjs`.

---

## 🖥️ 12. Frontend Execution Commands

All four frontends are built using **Vite** and configured with standard scripts:

| Portal | Local Dev Command | Default Dev Port | Production Build Command | Output Folder |
|---|---|---|---|---|
| **User Website** (`user-website`) | `npm run dev` | `http://localhost:5173` | `npm run build` | `dist/` |
| **Admin Portal** (`admin-portal`) | `npm run dev` | `http://localhost:5174` | `npm run build` (tsc + vite) | `dist/` |
| **Agent Portal** (`agent-portal`) | `npm run dev` | `http://localhost:5175` | `npm run build` (tsc + vite) | `dist/` |
| **Driver Portal** (`driver-portal`)| `npm run dev` | `http://localhost:5176` | `npm run build` (tsc + vite) | `dist/` |

Linting commands:
- `user-website`: `npm run lint` (`eslint .`)
- `agent-portal`: `npm run lint` (`oxlint`)
- `driver-portal`: `npm run lint` (`oxlint`)

---

## ⚙️ 13. Backend & AI Service Execution Commands

### Express Backend (`Backend/`)
```bash
# Start backend in development mode (watches and runs server.js)
npm run dev

# Start backend in production mode
npm start

# Run standalone database / API verification suites
node verify_apis.js
node verify_admin_portal.js
node verify_budget.js
node verify_chat.js
node testReferralFlow.js
```

### FastAPI AI Service (`ai-service/`)
```bash
# Start AI microservice with hot reloading
uvicorn app.main:app --reload --port 8000

# Start AI microservice with multi-worker production configuration
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## 📡 14. API Documentation & Important Endpoints

The Backend serves as the primary API Gateway (`/api/*`). The AI Service is proxied securely through the backend.

### Authentication & Profiles
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new traveler account |
| `POST` | `/api/auth/login` | Public | Authenticate traveler via email & password |
| `POST` | `/api/auth/google` | Public | Exchange Firebase Google token for JWT |
| `POST` | `/api/auth/send-otp` | Public | Dispatch phone / email OTP |
| `POST` | `/api/auth/verify-otp` | Public | Verify OTP and return session token |
| `GET` | `/api/user/profile` | Traveler | Fetch user profile, preferences & rewards |

### Tour Packages & Marketplace
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/trips/published` | Public | Fetch approved tour packages for discovery |
| `GET` | `/api/trips/published/:id` | Public | Fetch detailed package with itinerary & hotel info |
| `POST` | `/api/trips/create` | Traveler | Create custom collaborative trip |
| `GET` | `/api/trips/my-trips` | Traveler | Retrieve list of traveler's collaborative trips |

### Seat Maps & Interactive Booking
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/seats/:tripId` | Public | Generate dynamic coach seat layout and fetch booked seats |
| `POST` | `/api/bookings/create-order` | Traveler | Create booking draft and generate Razorpay order |
| `POST` | `/api/payments/verify` | Traveler | Verify Razorpay payment signature & confirm booking |
| `GET` | `/api/bookings/my-bookings` | Traveler | Retrieve confirmed bookings and tickets |

### Digital Boarding & Driver Transit
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/boarding/generate-qr` | Traveler | Generate QR code image URL for booking ticket |
| `POST` | `/api/driver/send-email-otp`| Public | Dispatch driver verification login OTP |
| `POST` | `/api/driver/login` | Public | Authenticate driver |
| `GET` | `/api/driver/my-trip` | Driver | Fetch driver's active assigned trip |
| `GET` | `/api/driver/passengers/:tripId`| Driver | Fetch verified passenger manifest |
| `POST` | `/api/driver/scan-qr` | Driver | Scan QR boarding code and mark passenger `BOARDED` |

### AI Microservice Gateway (Proxied via Backend)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Traveler | Memory-aware conversational travel planning with Gemini |
| `POST` | `/api/ai/search` | Traveler | Semantic vector search across packages with intent logging |
| `GET` | `/api/ai/recommendations` | Traveler | Personalized trip recommendations based on user vector profile |
| `GET` | `/api/ai/demands` | Agency/Admin| Aggregated destination demand insights for operators |
| `GET` | `/api/ai/analytics` | Admin | Trend analytics and chat interaction statistics |

### Agency & Administration
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/agent/profile/onboarding`| Agent | Submit agency KYC documentation and details |
| `POST` | `/api/agent/trips` | Agent | Create and publish new tour package |
| `POST` | `/api/admin/login` | Admin | Admin authentication with 2FA OTP |
| `GET` | `/api/admin/dashboard` | Admin | Platform metrics (revenue, active trips, agencies) |
| `PATCH`| `/api/admin/agents/:id/status`| Admin | Approve or reject agency KYC submission |
| `PATCH`| `/api/admin/trips/:id/approve` | Admin | Approve tour package for public traveler marketplace |

---

## 🛡️ 15. Authentication & User Roles

Traveloop V2 enforces role-based access control (RBAC) across four user roles:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Traveler (User) │       │ Travel Agency   │       │ Transit Driver  │       │ Platform Admin  │
│ Role: 'user'    │       │ Role: 'agent'   │       │ Role: 'driver'  │       │ Role: 'ADMIN'   │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │                         │
         ▼                         ▼                         ▼                         ▼
  authMiddleware            agentAuthMiddleware      driverAuthMiddleware      adminAuthMiddleware
         │                         │                         │                         │
  - Dual JWT / Firebase     - Verified KYC Check      - Status check            - SuperAdmin checks
  - Supabase 'users'        - Onboarding Step <= 5    - Must have 'driver' role - 2FA token validated
```

- **Traveler (`user`)**: Authenticated via dual-mode JWT (either custom Backend JWT or raw Firebase ID Token). Access restricted to personal bookings, collaborative trips, budgets, and reviews.
- **Agency (`agent`)**: Authenticated via agency JWT. `checkAgentKYC` middleware blocks unverified agencies from publishing trips or withdrawing funds until KYC status is `APPROVED`.
- **Driver (`driver`)**: Authenticated via phone/email OTP. Access scoped to assigned trip manifests and camera QR verification.
- **Admin (`ADMIN` / `SUPER_ADMIN`)**: Bootstrapped securely via environment variables. Protected by 2FA verification. Can manage commission rates, oversee payouts, and approve packages.

---

## 🧪 16. Testing & Quality Verification

### Standalone API & Feature Verification Scripts
The repository includes dedicated verification test suites inside `Backend/` that test live endpoints, database queries, and business workflows:

```bash
cd Backend

# Verify core REST APIs (auth, trips, bookings)
node verify_apis.js

# Verify admin portal operations (KYC, commissions, ledger)
node verify_admin_portal.js

# Verify budget calculator & expense splitting
node verify_budget.js

# Verify Socket.io real-time chat & notifications
node verify_chat.js

# Verify collaborative itinerary synchronization
node verify_collaboration.js

# Verify referral tracking and reward calculation
node testReferralFlow.js
```

### AI Service Verification & Interactive Docs
FastAPI provides automatic interactive API verification interfaces:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🚢 17. Production Build & Deployment

### 1. Docker Multi-Stage Builds
Each client portal (`user-website`, `admin-portal`, `agent-portal`, `driver-portal`) uses an optimized 2-stage Docker build:
1. **Builder Stage**: `node:20-alpine` runs `npm ci` and `npm run build`.
2. **Runner Stage**: `nginx:1.27-alpine` copies the static output from `/app/dist` to `/usr/share/nginx/html` and serves it via an unprivileged Nginx process.

### 2. CI/CD Pipeline (GitHub Actions -> AWS EC2)
The repository contains an automated deployment pipeline configured in [`.github/workflows/deploy.yml`](file:///d:/travel/traveloop_V2/.github/workflows/deploy.yml):
- **Trigger**: Push to the `main` branch.
- **Execution**: Connects securely to the AWS EC2 instance via SSH (`appleboy/ssh-action@v1.2.0`).
- **Pipeline Actions**:
  1. Pulls latest commits (`git fetch origin && git reset --hard origin/main`).
  2. Installs dependencies (`npm install`).
  3. Restarts or reloads the process via PM2 (`pm2 restart traveloop || pm2 start server.js --name traveloop`).
  4. Saves PM2 process state (`pm2 save`).

---

## 🔒 18. Security & Governance Considerations

- **Server-Side Authorization & Transactions**: Strict application-level role-based access control (RBAC), parameterized queries, and ACID MySQL transactions protect bookings, seat allocation, payments, and financial records.
- **HTTP Security Headers**: `helmet` is initialized across the backend to sanitize response headers and mitigate XSS, clickjacking, and MIME-sniffing.
- **Strict Origin Whitelisting (CORS)**: Access is bounded by `ALLOWED_ORIGINS` across production domains and local port ranges.
- **Tiered Rate Limiting**:
  - Global API Limiter: 200 req/15min in production.
  - Authentication Limiter: 20 req/15min to eliminate brute-force password guessing.
  - AI Gateway Limiter: 40 chat req/15min and 60 search req/15min to preserve Gemini API quotas.
- **Input Sanitization**: Global `sanitizeInput` middleware recursively strips dangerous characters and sanitizes payload strings.
- **Cryptographic Signature Verification**: Razorpay webhooks and payment receipts verify SHA256 HMAC signatures prior to marking any booking as confirmed.
- **Zero Exposed Secrets**: Sensitive production API keys are strictly loaded via `.env` files and excluded from version control via `.gitignore`.

---

## 🛠️ 19. Troubleshooting Guide

| Problem / Error | Root Cause | Solution |
|---|---|---|
| `EADDRINUSE: address already in use :::5000` | Another process is already running on port 5000 | The development server will automatically try port 5001/5002. Alternatively, kill the running process: `npx kill-port 5000`. |
| `MySQL Connection Refused / ECONNREFUSED` | MySQL server not running or wrong host | Ensure MySQL 8.0 is running (`docker compose up -d mysql`) and `DB_HOST`, `DB_PORT` match in `.env`. |
| `ER_ACCESS_DENIED_ERROR` | Incorrect MySQL user or password | Verify `DB_USER` and `DB_PASSWORD` in `Backend/.env` have grants on `DB_NAME`. |
| `401 Unauthorized / INVALID_TOKEN` | Token expired or mismatched `JWT_SECRET` | Ensure `JWT_SECRET` in `Backend/.env` matches between client generation and server verification. |
| `Qdrant connection refused (port 6333)` | Qdrant container is not running | Run `docker compose up -d qdrant` or verify port mapping with `docker ps`. |
| `AI Service: 500 AI chat unavailable` | `GEMINI_API_KEY` missing or invalid | Obtain a Gemini API Key from Google AI Studio and supply it in `ai-service/.env`. |
| `CORS Error in browser console` | Origin not present in `ALLOWED_ORIGINS` | Add your custom hostname/port to `ALLOWED_ORIGINS` in `Backend/.env`. |
| `html5-qrcode camera permission denied` | Browser blocked camera access | In `driver-portal`, grant camera permissions in your browser bar or serve over HTTPS/localhost. |

---

## ⚠️ 20. Current Limitations & Known Issues

1. **AviationStack Integration is Stubbed**: Although the flight routes and types exist, `flightController.js` serves mocked schedules until a live API subscription is configured.
2. **Expense Scanner OCR**: `expenseScannerController.js` currently serves a mock response while client-side vs. server-side Tesseract.js processing is being optimized.
3. **Multi-Currency Static Fallbacks**: Real-time exchange rate cache (`exchange_rate_caches`) uses static base exchange rates if external forex feeds are unreachable.
4. **Database Architecture Migration Completed**: The platform has been fully migrated to MySQL 8.0 (InnoDB utf8mb4); legacy Supabase PostgreSQL and MongoDB integrations have been completely retired.

---

## 🚀 21. Future Enhancements & Roadmap

- [ ] **Predictive AI Pricing Engine**: Dynamic seat pricing for agency group packages based on historical booking velocity and seasonal demand.
- [ ] **Live Telemetry & GPS Tracking**: Real-time geolocation sharing from driver devices into traveler trip dashboards via WebSockets.
- [ ] **Native Mobile Builds (Capacitor)**: Packaging `driver-portal` and `user-website` for Android & iOS app stores.
- [ ] **Multi-Carrier Flight API**: Transitioning from flight stubs to live Amadeus/Sabre or AviationStack streaming.
- [ ] **Smart Offline Manifests**: Progressive Web App (PWA) offline passenger caching for drivers operating in low-connectivity mountain regions.

---

## 🤝 22. Contribution Guidelines

1. **Fork the Repository** and create your branch from `main`:
   ```bash
   git checkout -b feature/amazing-travel-feature
   ```
2. **Adhere to Code Standards**:
   - Follow ESM imports across all backend modules.
   - Run linters (`npm run lint` / `oxlint`) before committing.
   - Ensure new endpoints include input validation and appropriate rate limiters.
3. **Commit Your Changes**:
   ```bash
   git commit -m "feat: implement predictive route pricing algorithm"
   ```
4. **Push to Your Fork & Open a Pull Request**:
   - Provide a clear PR description detailing features added, verification steps tested, and any schema changes required.

---

## 📄 23. License

Distributed under the **MIT License**. See [`LICENSE`](file:///d:/travel/traveloop_V2/LICENSE) for more details.

```text
MIT License
Copyright (c) 2026 Sanjai M
```