# 🌍 TravelLoop V2 — System Architecture & Technology Stack Documentation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1.svg)](https://www.mysql.com/)
[![Amazon S3](https://img.shields.io/badge/Storage-Amazon_S3-FF9900.svg)](https://aws.amazon.com/s3/)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-DC2626.svg)](https://qdrant.tech/)
[![Redis](https://img.shields.io/badge/Cache-Redis_7-DC382D.svg)](https://redis.io/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions_OIDC_+_AWS_SSM-2088FF.svg)](https://github.com/features/actions)

---

## 📖 Table of Contents

1. [Executive Project Overview](#1-executive-project-overview)
   - [Overall Technical Architecture](#overall-technical-architecture)
2. [Key Features Breakdown](#2-key-features-breakdown)
3. [Complete Technology Stack Inventory](#3-complete-technology-stack-inventory)
4. [Overall System Architecture](#4-overall-system-architecture)
5. [System Architecture Diagram](#5-system-architecture-diagram)
6. [Request and Data Flows](#6-request-and-data-flows)
7. [Complete Repository Folder Guide](#7-complete-repository-folder-guide)
8. [Application Services Breakdown](#8-application-services-breakdown)
9. [Database Design and Persistence](#9-database-design-and-persistence)
10. [Authentication and Authorization](#10-authentication-and-authorization)
11. [API Architecture & Endpoints](#11-api-architecture--endpoints)
12. [File Uploads and Media Storage](#12-file-uploads-and-media-storage)
13. [Configuration and Environment Variables](#13-configuration-and-environment-variables)
14. [Local Development Setup](#14-local-development-setup)
15. [Build, Testing, and Code Quality](#15-build-testing-and-code-quality)
16. [Production Deployment Architecture](#16-production-deployment-architecture)
17. [CI/CD Pipeline (GitHub Actions + AWS OIDC + SSM)](#17-cicd-pipeline-github-actions--aws-oidc--ssm)
18. [Networking, Observability, and Security](#18-networking-observability-and-security)
19. [Monitoring and Health Checks](#19-monitoring-and-health-checks)
20. [Operations and Troubleshooting Guide](#20-operations-and-troubleshooting-guide)
21. [Known Limitations and Stubs](#21-known-limitations-and-stubs)
22. [Future Improvements and Roadmap](#22-future-improvements-and-roadmap)
23. [Contribution Guidelines](#23-contribution-guidelines)
24. [License](#24-license)
25. [Project Metadata and Author](#25-project-metadata-and-author)

---

## 1. Executive Project Overview

**TravelLoop V2** is an enterprise-grade, multi-tenant travel planning, tour operator marketplace, and real-time transit orchestration platform designed by **Sanjai R.**

### The Problem It Solves
Traditional group travel and tour transit operations are burdened by disconnected point solutions:
- **Travelers** juggle fragmented tools: spreadsheets for group budgeting, email or PDF screenshots for tickets, messaging apps for coordination, and third-party weather or visa portals.
- **Tour Operators (Agencies)** face high onboarding friction, manual passenger manifest compilation, offline KYC verification delays, and zero real-time insight into emerging traveler demand trends.
- **Bus Drivers & Transit Coordinators** rely on printed paper manifests or manual headcounts, leading to boarding bottlenecks, ticket fraud, and lack of real-time communication during transit delays.
- **Platform Administrators** lack unified financial auditing, automated platform commission calculation, transparent KYC approval workflows, and centralized platform security controls.

### Target Users and Stakeholder Roles
TravelLoop V2 unifies four distinct user personas across dedicated web interfaces and backend services:
1. **Travelers (`user-website`)**: Plan collaborative multi-day itineraries, explore verified tour packages, reserve seats interactively via dynamic coach maps, track shared group budgets, manage packing lists, interact in real-time chat rooms, and generate digital QR boarding passes.
2. **Travel Agencies (`agent-portal`)**: Submit business KYC documentation, publish multi-day tour packages, configure coach seat layouts, review passenger manifests, track bookings, and evaluate AI-extracted market demand trends.
3. **Bus Drivers (`driver-portal`)**: Log in via OTP, access live trip manifests, scan traveler QR boarding passes with device cameras, verify boarding state (`NOT_BOARDED` vs `BOARDED`), and broadcast trip delay announcements.
4. **Platform Administrators (`admin-portal`)**: Review agency KYC applications, approve tour packages for the marketplace, set platform commission rates, audit transaction ledgers, track payouts, and inspect system logs.

### Application Service Roles
- **Frontend Portals (`user-website`, `agent-portal`, `driver-portal`, `admin-portal`)**: Specialized single-page applications built with React 19 and Vite. The public traveler portal is hosted on **Vercel** (`https://traveloop.sanjai.online`).
- **Backend API Gateway (`Backend/`)**: Express.js REST and WebSocket server running Node.js 22 on a private AWS EC2 instance. Acts as the single security gateway, handling authentication, transactions, storage authorization, and API proxying.
- **AI Microservice (`ai-service/`)**: Autonomous FastAPI application running Python 3.11 on the same private EC2 instance. Powers Retrieval-Augmented Generation (RAG) search, Google Gemini chat, and semantic travel demand extraction.
- **Relational Database (`MySQL 8.0`)**: Central transactional store hosting 49 tables, accessible by the backend via `mysql2/promise` with SSL/TLS certificate verification.
- **Object Storage (`Amazon S3`)**: Stores user media, profile avatars, tour package galleries, and private KYC verification documents in AWS region `ap-south-1`.

---

## Overall Technical Architecture

<p align="center">
  <img
    src="docs/images/traveloop-v2-architecture.png"
    alt="TravelLoop V2 Overall Technical Architecture"
    width="1000"
  />
</p>

The technical architecture diagram above illustrates the comprehensive multi-tier design, stakeholder entry points, and deployment lifecycle of TravelLoop V2:

- **Frontend**: Single-page and progressive web applications built with **React 19 + Vite**, hosted and continuously deployed on **Vercel** (`https://traveloop.sanjai.online`), serving Travelers (`user-website`), Tour Agencies (`agent-portal`), Bus Drivers (`driver-portal`), and Platform Administrators (`admin-portal`).
- **Backend API Gateway**: Central REST and WebSocket API built with **Node.js 22 + Express.js**, hosted on a private **AWS EC2** instance (`traveloop-backend.service`, port 5000), managing business logic, authentication, booking state, and storage operations.
- **AI Microservice**: Autonomous microservice built with **Python 3.11 + FastAPI**, hosted on the same EC2 instance (`traveloop-ai.service`, port 8000), orchestrating **Google Gemini** LLM generation, BAAI dense vector embeddings, **Qdrant** similarity search, and **Redis** conversation memory.
- **Database**: Dedicated **Amazon RDS for MySQL** 8.0 instance hosting 49 relational tables with TLS certificate verification, ACID transactions, and private VPC subnet isolation.
- **File Storage**: **Amazon S3** object storage bucket (`traveloop-media` in AWS region `ap-south-1`) providing secure media hosting via direct presigned PUT URLs and backend-mediated uploads, with strict ownership and admin access control for private KYC documents.
- **Authentication**: **Firebase Authentication** on the client side (Google OAuth & Phone OTP verification), coupled with server-side Firebase Admin SDK verification and custom backend JWT session token management.
- **CI/CD Pipeline**: Continuous deployment from the GitHub `main` branch to the private AWS EC2 instance using **GitHub Actions**, **AWS OIDC** role assumption (`TraveloopGitHubActionsDeployRole`), and **AWS Systems Manager (SSM)** Run Command for automated, zero-downtime, and non-destructive deployments.

---

## 2. Key Features Breakdown

The following matrix documents the verified implementation status of platform capabilities:

| Feature / Capability | Subsystem | Implementation Details | Status |
|---|---|---|---|
| **Interactive Coach Seat Selection** | `user-website`, `agent-portal`, `Backend` | Dynamic grid layout based on bus type (AC Sleeper, Semi-Sleeper, Volvo); live seat reservation conflict checks in `seatRoutes.js`. | **Implemented** |
| **Digital QR Boarding Passes** | `user-website`, `driver-portal`, `Backend` | Cryptographic QR generation via `qrcode` / `qrcode.react`; live camera-based QR decoding in `driver-portal` via `html5-qrcode`. | **Implemented** |
| **Driver Transit Manifest** | `driver-portal`, `Backend` | Live passenger lists, departure tracking, boarding status toggles (`BOARDED`), and passenger lookup via `driverRoutes.js`. | **Implemented** |
| **Agency KYC Onboarding** | `agent-portal`, `admin-portal`, `Backend` | 5-step registration wizard, document upload to S3, and admin approval workflow governed by `kycMiddleware.js`. | **Implemented** |
| **Admin Marketplace Governance** | `admin-portal`, `Backend` | Agency verification, package review/approval, commission rate management, and activity audit logging in `adminRoutes.js`. | **Implemented** |
| **Memory-Aware AI Travel Assistant** | `ai-service`, `Backend`, `user-website` | Multi-turn chat using Google Gemini (`gemini-flash-latest`), Redis 30-message conversational memory buffer, and MySQL long-term history persistence. | **Implemented** |
| **Semantic Trip RAG Search** | `ai-service`, `Backend` | Dense vector retrieval using `BAAI/bge-small-en-v1.5` embeddings (384-d) against Qdrant collection `trip_vectors`. | **Implemented** |
| **Market Demand Extraction** | `ai-service`, `agent-portal` | Unstructured chat analysis extracting destinations, budgets, and group preferences into MySQL `travel_intents`. | **Implemented** |
| **Direct & Presigned S3 Uploads** | `Backend`, `user-website` | Dual-mode uploads via AWS S3 SDK v3: Backend-mediated multipart buffer uploads and presigned direct client URLs; private KYC access controls. | **Implemented** |
| **Real-Time Group Collaboration** | `user-website`, `Backend` | Socket.io rooms per trip (`trip_:id`), real-time typing indicators, member presence, and instant messaging. | **Implemented** |
| **Expense Budgeting & Splitting** | `user-website`, `Backend` | Multi-currency travel expense tracking, category totals, and participant splits in `budgetRoutes.js`. | **Implemented** |
| **Packing Checklists & Notes** | `user-website`, `Backend` | Shared checklist items, completed state toggles, and rich text trip notes in `checklistRoutes.js` and `notesRoutes.js`. | **Implemented** |
| **Destination Visa Guide** | `user-website`, `Backend` | Entry requirements, passport validity rules, and e-visa guidelines in `visaRoutes.js`. | **Implemented** |
| **Weather Forecasts & Advisories** | `user-website`, `Backend` | Open-Meteo API integration mapping WMO weather codes to safety alerts and 7-day temperature forecasts in `weatherRoutes.js`. | **Implemented** |
| **Referrals & Gamification** | `Backend`, `user-website` | Alphanumeric referral code generation, invite tracking, reward points ledger, and coupon validation in `referralRoutes.js`. | **Implemented** |
| **Razorpay Payment Integration** | `Backend`, `user-website` | Order creation via Razorpay SDK and HMAC-SHA256 signature verification in `paymentRoutes.js`; test fallbacks when dummy keys are supplied. | **Implemented** |
| **Automated EC2 CI/CD** | `.github/workflows`, `scripts/` | GitHub Actions OIDC authentication, AWS SSM Run Command dispatcher, fast-forward git merges, and systemd service restarts. | **Implemented** |
| **Flight Status Tracking** | `Backend` (`flightRoutes.js`) | Endpoints exist (`/api/flights/create`, `/refresh`), but `flightController.js` serves mock data pending live flight API integration. | **Partial / Stub** |
| **Receipt OCR Scanner** | `Backend` (`scannerRoutes.js`) | `tesseract.js` dependency installed; `/api/scanner/scan` currently responds with a structured mock extraction payload. | **Partial / Stub** |
| **Message Reactions & Editing** | `Backend` (`chatRoutes.js`) | Live messages synchronize over WebSockets; message editing and reaction endpoints return stub payloads. | **Partial / Stub** |
| **Predictive AI Dynamic Pricing** | Future Roadmap | Automated seat pricing adjustments based on historical booking velocity and seasonal demand. | **Planned** |
| **Live Driver GPS Telemetry** | Future Roadmap | Continuous streaming of driver geolocation coordinates to traveler dashboards via WebSockets. | **Planned** |

---

## 3. Complete Technology Stack Inventory

### Frontend Applications

| Component / Tool | Verified Version | Purpose & Usage |
|---|---|---|
| **Core Framework** | React `^19.2.7`, `react-dom` `^19.2.7` | UI component tree across `user-website`, `agent-portal`, `admin-portal`, `driver-portal` |
| **Build Tool & Bundler** | Vite `^8.0.10` (`driver-portal`: `^8.1.0`) | Fast HMR, ES module bundling, and production asset optimization |
| **Language** | TypeScript `~5.7.2` / `~6.0.2` & JavaScript (ESM) | TypeScript used in `agent-portal`, `admin-portal`, `driver-portal`; ESM JavaScript in `user-website` |
| **Styling Framework** | TailwindCSS `^3.4.3`, PostCSS `^8.4.35`, Autoprefixer | Utility-first responsive design tokens across all four web portals |
| **Animation Library** | Framer Motion `^12.43.0` (`agent-portal`: `^11.11.9`) | Smooth modal transitions, drawer animations, and interactive UI micro-interactions |
| **Icon System** | Lucide React `^1.14.0` (`driver-portal`: `^1.21.0`) | Comprehensive SVG icon library |
| **Routing** | React Router DOM `^7.15.0` (`driver-portal`: `^7.18.0`) | Client-side routing, protected route guards, and URL parameters |
| **State Management** | Zustand `^5.0.3` (`driver-portal`: `^5.0.14`) | Lightweight global client state in `agent-portal`, `admin-portal`, `driver-portal` |
| **Data Fetching & Cache** | TanStack React Query `^5.66.0` | Server-state synchronization and cache invalidation in admin and agent portals |
| **Form Management** | React Hook Form `^7.54.2` | High-performance form state handling and validation in admin and agent portals |
| **HTTP Client** | Axios `^1.7.9` (`driver-portal`: `^1.18.1`) | Centralized API client with interceptors, URL normalization, auth injection, and retries |
| **Real-Time Client** | Socket.IO Client `^4.8.3` | Bidirectional WebSocket communication for chat, trip updates, and notifications |
| **Authentication Client** | Firebase Web SDK `^12.14.0` (`driver-portal`: `^12.15.0`) | Google OAuth popups and phone OTP verification |
| **QR Code Processing** | `qrcode.react` `^4.2.0`, `html5-qrcode` `^2.3.8` | QR rendering in `user-website`; camera barcode scanning in `driver-portal` |
| **PDF & Export** | `jspdf` `^2.5.2`, `html2canvas` `^1.4.1` | Client-side export of booking summaries and digital passes |
| **Internationalization** | `i18next` `^24.2.0`, `react-i18next` `^15.4.0` | Multi-language localization in `user-website` |
| **PWA Plugin** | `vite-plugin-pwa` `^1.1.0` | Service worker registration and offline caching in `user-website` |

### Backend API Gateway

| Component / Tool | Verified Version | Purpose & Usage |
|---|---|---|
| **Runtime** | Node.js `22.x` (ES Modules, `"type": "module"`) | Asynchronous server-side execution environment |
| **Web Framework** | Express.js `^4.21.2` | REST API routing, JSON body parsing, and middleware pipeline |
| **Database Driver** | `mysql2` `^3.24.5` (`mysql2/promise`) | High-performance connection pooling, parameterized queries, and TLS certificate support |
| **Query Abstraction** | Custom `MySQLQueryBuilder` (`Backend/config/db.js`) | Fluent Supabase-compatible query builder with transaction support |
| **Compatibility Bridge**| `Backend/config/supabase.js` | Direct bridge redirecting legacy Supabase imports to `MySQLQueryBuilder` |
| **Object Storage SDK** | `@aws-sdk/client-s3` `^3.1149.0`, `@aws-sdk/s3-request-presigner` | S3 buffer upload, presigned upload/download URLs, and metadata persistence |
| **Authentication & JWT**| `jsonwebtoken` `^9.0.3`, `bcryptjs` `^3.0.3` | Custom JWT issuance, token verification, and password hashing |
| **Firebase Admin SDK** | `firebase-admin` `^10.3.0` | Server-side verification of Firebase ID tokens and user auto-provisioning |
| **WebSockets** | `socket.io` `^4.8.1` | Real-time event broadcasting, room management, and push notification triggers |
| **Security Middleware** | `helmet` `^8.2.0`, `cors` `^2.8.6`, `express-rate-limit` `^8.5.2` | HTTP security headers, CORS origin enforcement, and tiered route rate limiting |
| **Payment Gateway** | `razorpay` `^2.9.6` | Order generation and payment signature verification |
| **File Processing** | `multer` `^2.2.0`, `pdfkit` `^0.18.0`, `qrcode` `^1.5.4` | Multipart upload buffering, server-side PDF generation, and QR code creation |
| **Email Service** | `nodemailer` `^9.0.3`, `googleapis` `^173.0.0` | Transactional email delivery and OTP dispatch via Gmail OAuth2 |
| **OCR (Stubbed)** | `tesseract.js` `^7.0.0` | Installed for optical character recognition on uploaded receipts |

### AI Microservice

| Component / Tool | Verified Version | Purpose & Usage |
|---|---|---|
| **Language & Runtime** | Python `3.11+` | Asynchronous Python microservice runtime |
| **Web Framework** | FastAPI `^0.110.0+` | High-performance ASGI framework with automatic OpenAPI documentation |
| **ASGI Server** | Uvicorn `^0.28.0+` | Production ASGI web server running FastAPI |
| **LLM Engine** | Google Gemini (`google-generativeai`) | Generative travel itineraries, chat assistance, and demand extraction |
| **Vector Embeddings** | `sentence-transformers` (`BAAI/bge-small-en-v1.5`) | 384-dimensional dense semantic vector generation |
| **Vector Database** | Qdrant (`qdrant-client`) | Vector similarity search across `trip_vectors` and `user_profiles` collections |
| **In-Memory Cache** | Redis (`redis[hiredis]`) | Short-term conversational memory buffer (30 messages, 24h TTL) |
| **Database Access** | SQLAlchemy `2.x`, PyMySQL `^1.1.0`, Cryptography | Relational access to MySQL with SSL/TLS verification |
| **Configuration** | `pydantic`, `python-dotenv` | Type-safe environment settings and request validation |
| **Cloud SDK** | `boto3` | AWS SDK for cross-service cloud integrations |

---

## 4. Overall System Architecture

TravelLoop V2 is structured into distinct network, application, and persistence tiers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PUBLIC INGRESS & CLIENTS                           │
│                                                                             │
│  [Travelers]          [Tour Agencies]       [Transit Drivers]    [Admins]   │
│       │                      │                      │               │       │
│       ▼                      ▼                      ▼               ▼       │
│  Vercel Frontend        Vite Portal            Vite Portal     Vite Portal  │
│  traveloop.sanjai.online :5175                 :5176           :5174        │
└───────┬──────────────────────┬──────────────────────┬───────────────┬───────┘
        │                      │                      │               │
        └──────────────────────┼──────────────────────┴───────────────┘
                               │ HTTPS / WSS Requests
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AWS CLOUD (ap-south-1) — PUBLIC INGRESS                 │
│                                                                             │
│  DNS: api.traveloop.sanjai.online                                           │
│  TLS Termination & Port Forwarding (Application Gateway / Reverse Proxy)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Port 5000 (Internal)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PRIVATE AWS EC2 INSTANCE (Backend & AI)                   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Express.js API Gateway (Node.js 22, Port 5000)                        │  │
│  │ - Service: traveloop-backend.service                                  │  │
│  │ - Auth Middleware (JWT + Firebase Admin)                              │  │
│  │ - Socket.io Server (Rooms: trip_:id, user_:id)                        │  │
│  │ - S3 Storage Manager (@aws-sdk/client-s3)                             │  │
│  │ - MySQL Connection Pool (mysql2/promise + TLS)                        │  │
│  └──────────────────┬─────────────────────────────────┬──────────────────┘  │
│                     │ HTTP (Internal Loopback)        │                     │
│                     │ http://127.0.0.1:8000           │                     │
│                     ▼                                 │                     │
│  ┌──────────────────────────────────────────────┐     │                     │
│  │ FastAPI AI Microservice (Python 3.11)        │     │                     │
│  │ - Service: traveloop-ai.service              │     │                     │
│  │ - Google Gemini Flash LLM Gateway            │     │                     │
│  │ - SentenceTransformers (384-d BAAI/bge)      │     │                     │
│  │ - SQLAlchemy MySQL Connector (TLS Enabled)   │     │                     │
│  └──────────────────┬───────────────────────┬───┘     │                     │
└─────────────────────┼───────────────────────┼─────────┼─────────────────────┘
                      │                       │         │
                      │ Port 6333             │ Port 6379│ Port 3306 (TLS)
                      ▼                       ▼         ▼
┌──────────────────────────┐  ┌────────────────┐  ┌──────────────────────────┐
│ Qdrant Vector Database   │  │ Redis 7 Cache  │  │ Amazon RDS MySQL 8.0     │
│ - trip_vectors           │  │ - Chat Memory  │  │ - 49 Relational Tables   │
│ - user_profiles          │  │ - Seat Locks   │  │ - SSL CA Bundle Verified │
└──────────────────────────┘  └────────────────┘  └──────────────────────────┘
                      ▲
                      │ Direct / Presigned Uploads & Downloads
┌─────────────────────┴───────────────────────────────────────────────────────┐
│                      EXTERNAL MANAGED CLOUD SERVICES                         │
│                                                                             │
│  Amazon S3 (Media & KYC)  │  Google Gemini API  │  Firebase Auth / Admin     │
│  Razorpay Payment Gateway │  Open-Meteo Weather │  Gmail OAuth2 SMTP         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. System Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Frontend Tier"]
        UW["Traveler Website (Vercel)<br/>React 19 / Vite / PWA<br/>traveloop.sanjai.online"]
        AP["Admin Portal<br/>React 19 / TypeScript / Vite<br/>Port 5174"]
        AGP["Agent Portal<br/>React 19 / TypeScript / Vite<br/>Port 5175"]
        DP["Driver Portal<br/>React 19 / TypeScript / Vite<br/>Port 5176"]
    end

    subgraph Ingress["Public Entry & Gateway"]
        DNS["DNS & TLS Entry<br/>api.traveloop.sanjai.online"]
    end

    subgraph EC2["Private AWS EC2 Host (ap-south-1)"]
        subgraph BackendTier["Backend Application Service"]
            BE["Express.js API Gateway (Port 5000)<br/>systemd: traveloop-backend.service<br/>JWT & Firebase Auth / S3 Manager"]
            WS["Socket.io WebSocket Server<br/>Rooms: trip_:id, user_:id"]
        end

        subgraph AITier["AI Microservice"]
            AI["FastAPI Engine (Port 8000)<br/>systemd: traveloop-ai.service<br/>LangChain / Pydantic / SQLAlchemy"]
            EMBED["SentenceTransformers<br/>BAAI/bge-small-en-v1.5 (384-d)"]
        end
    end

    subgraph Persistence["Persistence & Cache Tier"]
        RDS[("Amazon RDS MySQL 8.0<br/>49 Tables (InnoDB, utf8mb4)<br/>TLS Verified with global-bundle.pem")]
        REDIS[("Redis 7 Cache<br/>Conversational Memory Buffer (30 msgs)<br/>Port 6379")]
        QDRANT[("Qdrant Vector DB<br/>Collections: trip_vectors, user_profiles<br/>Port 6333")]
    end

    subgraph CloudStorage["Storage & Third-Party APIs"]
        S3["Amazon S3 Bucket<br/>traveloop-media (ap-south-1)<br/>Presigned & Direct Media"]
        GEMINI["Google Gemini Flash API<br/>LLM Inference & Planning"]
        FBAUTH["Firebase Authentication<br/>Google OAuth & Phone OTP"]
        RZP["Razorpay Payment Gateway<br/>Orders & HMAC Verification"]
        SMTP["Gmail OAuth2 / Nodemailer<br/>Transactional Email & OTP"]
    end

    subgraph DevOps["CI/CD Automation Pipeline"]
        GHA["GitHub Actions (main branch)<br/>.github/workflows/deploy-ec2.yml"]
        OIDC["AWS OIDC Security Provider<br/>TraveloopGitHubActionsDeployRole"]
        SSM["AWS Systems Manager (SSM)<br/>AWS-RunShellScript Document"]
    end

    %% Client communication
    UW -->|HTTPS REST| DNS
    UW -.->|WSS Events| DNS
    AP -->|HTTPS REST| DNS
    AGP -->|HTTPS REST| DNS
    DP -->|HTTPS REST| DNS

    DNS -->|Port 5000| BE
    DNS -.->|WebSockets| WS

    %% Backend integrations
    BE <--> WS
    BE -->|Internal Loopback :8000| AI
    BE -->|mysql2/promise + TLS| RDS
    BE -->|Redis Client| REDIS
    BE -->|AWS SDK v3| S3
    BE -->|Admin SDK| FBAUTH
    BE -->|Orders & HMAC| RZP
    BE -->|OAuth2 SMTP| SMTP

    %% AI Service integrations
    AI --> EMBED
    AI -->|REST Inference| GEMINI
    AI -->|Vector Search :6333| QDRANT
    AI -->|Memory Buffer :6379| REDIS
    AI -->|PyMySQL + TLS :3306| RDS

    %% Direct Storage Uploads
    UW -.->|Direct Presigned PUT| S3

    %% Deployment flow
    GHA -->|Assume Role via OIDC| OIDC
    OIDC -->|Authorize| SSM
    SSM -->|RunShellScript| EC2
```

---

## 6. Request and Data Flows

### Flow 1: Client Request & URL Normalization
1. **Frontend Initiation**: In `user-website`, API calls utilize `getApiUrl()` from [`src/utils/api.js`](file:///d:/travel/traveloop_V2/user-website/src/utils/api.js) and the centralized `apiClient` instance in [`src/utils/apiClient.js`](file:///d:/travel/traveloop_V2/user-website/src/utils/apiClient.js).
2. **Duplicate Prevention**: If `VITE_API_URL` contains a trailing `/api` and the request path also specifies `/api/endpoint`, the request interceptor normalizes the path to eliminate duplicate `/api/api/` prefixes.
3. **Token Injection**: The interceptor reads `localStorage.getItem("token")` or `"agentToken"` and attaches `Authorization: Bearer <token>`.
4. **Retry Loop**: Network errors or `5xx` server responses trigger an automatic exponential backoff retry (up to 2 attempts) before throwing a normalized error.

### Flow 2: User Login & Dual Authentication
1. **Credentials Submission**: Traveler sends credentials to `POST /api/auth/login` or completes Google OAuth via Firebase Client SDK and sends the token to `POST /api/auth/google`.
2. **Backend Authentication Guard**: [`Backend/middleware/authMiddleware.js`](file:///d:/travel/traveloop_V2/Backend/middleware/authMiddleware.js) verifies incoming tokens:
   - Primary: Verifies token against backend `JWT_SECRET`.
   - Fallback: Verifies token as a raw Firebase ID token using `admin.auth().verifyIdToken()`.
3. **Database Account Lookup**: Searches `users` table in MySQL by `id`, `firebase_uid`, or `email`.
4. **Auto-Provisioning**: If a verified Firebase token belongs to an email not yet registered in MySQL, the middleware automatically provisions a new row in `users` with `role: "user"`.
5. **Token Issuance**: Returns a signed JWT token containing user identity and role.

### Flow 3: AI Travel Assistant Conversation
1. **Chat Submission**: Authenticated user submits a message to `POST /api/ai/chat` on the backend.
2. **Backend Gateway Proxy**: [`Backend/controllers/aiController.js`](file:///d:/travel/traveloop_V2/Backend/controllers/aiController.js) constructs a stable session identifier (`session-<userId>-<YYYYMMDD>`) and proxies the request to `http://127.0.0.1:8000/chat`. Frontends never communicate with the AI service directly.
3. **AI Context Loading**: In `ai-service`, the chat router retrieves recent conversational history (up to 30 messages) from Redis.
4. **Prompt Augmentation & Inference**: The system prompt and user preferences are assembled and passed to Google Gemini (`gemini-flash-latest`).
5. **Memory & Intent Persistence**:
   - The user message and assistant reply are appended to the Redis session list with a 24-hour TTL.
   - The interaction is asynchronously persisted in MySQL (`chat_history` and `travel_intents`).
6. **Response Delivery**: The structured AI response returns through the backend to the frontend.

### Flow 4: Media Uploads to Amazon S3
1. **Presigned Upload Flow**:
   - Client sends filename, MIME type, folder, and visibility to `POST /api/upload/presign`.
   - Backend validates the MIME type against `FILE_RULES` in [`Backend/services/storage/s3StorageService.js`](file:///d:/travel/traveloop_V2/Backend/services/storage/s3StorageService.js).
   - Generates a short-lived (15 min) PUT presigned URL using `@aws-sdk/s3-request-presigner`.
   - Client directly uploads binary data to Amazon S3 via `PUT`.
   - Client notifies `POST /api/upload/confirm`, which records metadata in the `uploaded_files` table.
2. **Backend Buffer Upload Flow**:
   - Client posts multipart form data to `POST /api/upload`.
   - Multer buffers the file in memory; `UploadService.uploadFile` uploads the buffer to S3 and inserts metadata into `uploaded_files`.
3. **Private Document Downloads**:
   - Requests to `GET /api/upload/download/:fileId` verify that the caller is the owner or an administrator before returning an authorized 1-hour presigned GET URL.

### Flow 5: Seat Reservation & Payment Verification
1. **Seat Selection**: Traveler views live bus seat availability from `GET /api/seats/:tripId`.
2. **Order Creation**: Client calls `POST /api/payment/create-order`. Backend creates a booking record with status `DRAFT` and initializes an order with Razorpay (`orders.create`).
3. **Payment Completion**: Traveler completes payment through Razorpay modal.
4. **Signature Verification**: Client posts `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `POST /api/payment/verify`.
5. **HMAC Check & Confirmation**: Backend computes HMAC-SHA256 of `order_id|payment_id` using `RAZORPAY_KEY_SECRET`. Upon match, the booking status transitions to `CONFIRMED`, `payment_status` becomes `PAID`, seats are locked in `seat_bookings`, and a QR code boarding pass is generated.

### Flow 6: Driver Boarding & Manifest Scanning
1. **Driver Authentication**: Driver logs in via OTP sent to phone or email (`POST /api/driver/login`).
2. **Manifest Loading**: Driver views passenger list for their assigned trip (`GET /api/driver/passengers/:tripId`).
3. **Hardware Scanning**: Driver scans the traveler's digital QR pass using device camera (`html5-qrcode`).
4. **Validation Request**: Driver portal sends decoded token to `POST /api/driver/scan-qr`.
5. **Status Update & Real-Time Broadcast**: Backend validates booking code in MySQL, updates passenger boarding state to `BOARDED`, and broadcasts an instant `passenger_boarded` event across Socket.io to notify the traveler.

---

## 7. Complete Repository Folder Guide

```
traveloop_V2/
├── .github/
│   └── workflows/
│       └── deploy-ec2.yml          # Production CI/CD workflow (OIDC + SSM deployment)
├── .dockerignore                   # Docker build exclusions
├── .env.example                    # Global Vite build-argument template
├── .gitattributes                  # LF line-ending normalization for shell scripts
├── .gitignore                      # Git ignored files (node_modules, .env, pem keys)
├── docker-compose.yml              # Local container composition (MySQL, Redis, Qdrant)
├── LICENSE                         # Project MIT License
├── README.md                       # Comprehensive platform documentation
│
├── Backend/                        # Node.js 22 / Express API Gateway (Port 5000)
│   ├── .env.example                # Backend environment variable template
│   ├── config/                     # Configuration modules
│   │   ├── db.js                   # MySQLQueryBuilder & database initialization
│   │   ├── env.js                  # Environment variable validation
│   │   ├── firebaseAdmin.js        # Firebase Admin SDK initialization
│   │   ├── mysql.js                # mysql2/promise connection pool & RDS TLS config
│   │   └── supabase.js             # Backward-compatibility bridge routing to MySQL
│   ├── controllers/                # 18 business logic controllers
│   │   ├── aiController.js         # AI service gateway proxy
│   │   ├── authController.js       # User registration, login, OTP
│   │   ├── bookingController.js    # Booking creation, cancellation, status
│   │   ├── driverController.js     # Driver manifests & QR verification
│   │   └── uploadController.js     # Media upload management
│   ├── middleware/                 # Security and authorization middleware
│   │   ├── adminAuthMiddleware.js  # Administrator RBAC & 2FA guards
│   │   ├── agentAuthMiddleware.js  # Tour agency authentication
│   │   ├── authMiddleware.js       # Traveler dual JWT/Firebase authentication
│   │   ├── driverAuthMiddleware.js # Transit driver authentication
│   │   ├── errorMiddleware.js      # Global error logging middleware
│   │   ├── kycMiddleware.js        # Agency KYC approval verification
│   │   ├── sanitize.js             # Input sanitization middleware
│   │   └── uploadMiddleware.js     # Multer memory storage configuration
│   ├── routes/                     # 38 Express route modules
│   │   ├── adminRoutes.js          # Platform management endpoints
│   │   ├── agentRoutes.js          # Agency package & booking endpoints
│   │   ├── aiRoutes.js             # AI gateway endpoints
│   │   ├── authRoutes.js           # Traveler authentication endpoints
│   │   ├── boardingRoutes.js       # QR generation and verification
│   │   ├── bookingRoutes.js        # Reservation and booking routes
│   │   ├── driverRoutes.js         # Driver transit & manifest routes
│   │   ├── paymentRoutes.js        # Razorpay order & signature routes
│   │   ├── seatRoutes.js           # Coach seat map & selection routes
│   │   └── uploadRoutes.js         # S3 presigned & direct upload routes
│   ├── services/                   # Business and infrastructure services
│   │   ├── aiService.js            # Axios client communicating with AI microservice
│   │   ├── emailService.js         # Nodemailer & Gmail OAuth2 integration
│   │   ├── storage/
│   │   │   └── s3StorageService.js # AWS S3 client, presigning, and validation
│   │   └── uploadService.js        # File upload orchestration & metadata saving
│   ├── sql/
│   │   └── mysql_schema.sql        # MySQL master schema (49 relational tables)
│   ├── utils/                      # Helper utilities
│   │   └── bootstrapAdmin.js       # Automatic super-admin seeder on startup
│   ├── Dockerfile                  # Multi-stage Node 20/22 container definition
│   ├── package.json                # Dependencies and runtime scripts
│   └── server.js                   # Application entry point & Socket.io server
│
├── ai-service/                     # Python 3.11 / FastAPI AI Microservice (Port 8000)
│   ├── .env.example                # AI microservice environment variable template
│   ├── app/
│   │   ├── api/                    # FastAPI route modules
│   │   │   ├── analytics.py        # Travel trend analytics
│   │   │   ├── chat.py             # Memory-aware Gemini chat endpoints
│   │   │   ├── demands.py          # Market demand aggregation endpoints
│   │   │   ├── embed.py            # Vector embedding endpoints
│   │   │   ├── health.py           # Dependency health check endpoint
│   │   │   ├── recommendations.py  # Personalized recommendation endpoints
│   │   │   └── search.py           # Semantic RAG search endpoints
│   │   ├── core/                   # Infrastructure connectors
│   │   │   ├── database.py         # SQLAlchemy MySQL connection with TLS
│   │   │   ├── gemini.py           # Google Gemini API connector
│   │   │   ├── qdrant.py           # Qdrant client connection & collection setup
│   │   │   └── redis.py            # Redis connection & memory manager
│   │   ├── models/                 # Pydantic schemas for request/response validation
│   │   ├── repositories/           # Database access layer
│   │   ├── services/               # Vector search, memory, and analytics services
│   │   └── main.py                 # FastAPI application instance & lifespan manager
│   ├── Dockerfile                  # Python 3.11 Slim container definition
│   └── requirements.txt            # Python dependencies (FastAPI, LangChain, Qdrant)
│
├── user-website/                   # Traveler Portal — React 19 / Vite (Port 5173 / Vercel)
│   ├── .env.example                # Frontend environment variable template
│   ├── src/
│   │   ├── components/             # Reusable UI widgets, modals, seat selectors
│   │   ├── context/                # AuthContext, SocketContext
│   │   ├── pages/                  # 41 client pages (Itinerary, Bookings, Chat)
│   │   ├── services/               # Service wrappers
│   │   ├── utils/
│   │   │   ├── api.js              # URL construction & fetch monkeypatch
│   │   │   └── apiClient.js        # Axios client with interceptors & retry logic
│   │   ├── App.jsx                 # Route definitions & layout wrappers
│   │   └── main.jsx                # Application root entry point
│   ├── package.json                # Frontend dependencies and Vite configuration
│   └── vite.config.js              # Vite bundler configuration with PWA plugin
│
├── agent-portal/                   # Travel Agency Portal — React 19 / TypeScript (Port 5175)
│   ├── .env.example                # Agent portal environment template
│   ├── src/                        # Pages: Dashboard, Trips, KYC Onboarding, Demand
│   ├── package.json                # TypeScript & React Query dependencies
│   └── vite.config.ts              # Vite configuration
│
├── admin-portal/                   # Platform Administration — React 19 / TypeScript (Port 5174)
│   ├── .env.example                # Admin portal environment template
│   ├── src/                        # Pages: KYC Approvals, Trips, Commissions, Ledgers
│   ├── package.json                # TypeScript & Zustand dependencies
│   └── vite.config.ts              # Vite configuration
│
├── driver-portal/                  # Transit Driver Portal — React 19 / TypeScript (Port 5176)
│   ├── .env.example                # Driver portal environment template
│   ├── src/                        # Pages: Trip Manifest, Camera QR Scanner
│   ├── package.json                # HTML5 QR code & Zustand dependencies
│   └── vite.config.ts              # Vite configuration
│
├── nginx/                          # Nginx configuration for multi-tenant reverse proxy
│   └── nginx.conf                  # Route mapping for local multi-portal containerization
│
├── project-resources/              # Project design documentation, legal sites, shared UI
└── scripts/                        # Operational and deployment scripts
    └── deploy-ec2.sh               # Production EC2 deployment script (SSM executed)
```

---

## 8. Application Services Breakdown

### Service 1: Traveler Website (`user-website`)
- **Port / Location**: Local port `5173`; production hosted on **Vercel** (`https://traveloop.sanjai.online`).
- **Entry Points**: [`src/main.jsx`](file:///d:/travel/traveloop_V2/user-website/src/main.jsx), [`src/App.jsx`](file:///d:/travel/traveloop_V2/user-website/src/App.jsx).
- **Core Functionality**: Public tour marketplace browsing, personalized trip authoring, collaborative group budgets, live WebSocket group chat, interactive coach seat maps, and QR boarding pass access.

### Service 2: Travel Agency Portal (`agent-portal`)
- **Port / Location**: Local port `5175`.
- **Entry Points**: `src/main.tsx`, `src/App.tsx`.
- **Core Functionality**: 5-step agency KYC registration wizard, tour package creation with custom seat layouts, passenger manifest inspection, booking reconciliation, and AI-driven market demand analysis.

### Service 3: Bus Driver Portal (`driver-portal`)
- **Port / Location**: Local port `5176`.
- **Entry Points**: `src/main.tsx`, `src/App.tsx`.
- **Core Functionality**: Phone/Email OTP login, assigned departure manifests, real-time camera-based QR code verification (`html5-qrcode`), boarding state updates, and delay broadcast announcements.

### Service 4: Admin Governance Portal (`admin-portal`)
- **Port / Location**: Local port `5174`.
- **Entry Points**: `src/main.tsx`, `src/App.tsx`.
- **Core Functionality**: Agency KYC verification review, tour package approvals, platform commission rate configuration, transaction auditing, and system metrics.

### Service 5: Backend API Gateway (`Backend/`)
- **Port / Location**: Local port `5000`; systemd service `traveloop-backend.service` on private AWS EC2.
- **Entry Point**: [`Backend/server.js`](file:///d:/travel/traveloop_V2/Backend/server.js).
- **Core Functionality**: REST API routing (38 route modules), Socket.io server, authentication (JWT + Firebase Admin), MySQL connection pool management, AWS S3 object storage operations, and proxying AI requests to `ai-service`.

### Service 6: AI Microservice (`ai-service/`)
- **Port / Location**: Local port `8000` (bound strictly to `127.0.0.1:8000`); systemd service `traveloop-ai.service` on private AWS EC2.
- **Entry Point**: [`ai-service/app/main.py`](file:///d:/travel/traveloop_V2/ai-service/app/main.py).
- **Core Functionality**: Google Gemini LLM chat synthesis, Redis short-term conversational buffer, vector embedding (`BAAI/bge-small-en-v1.5`), Qdrant similarity search, and automated travel demand extraction.

---

## 9. Database Design and Persistence

TravelLoop V2 uses **MySQL 8.0** (InnoDB engine, `utf8mb4` charset) as its primary transactional database. The master schema is maintained in [`Backend/sql/mysql_schema.sql`](file:///d:/travel/traveloop_V2/Backend/sql/mysql_schema.sql).

### Core Entities & Relationships

```
┌─────────────┐       1:N       ┌──────────────┐       1:N       ┌───────────────┐
│   agents    │ ─────────────── │ agent_trips  │ ─────────────── │   bookings    │
└─────────────┘                 └──────────────┘                 └───────┬───────┘
       │                               │                                 │
       │                               │ 1:N                             │ 1:N
       │                               ▼                                 ▼
       │                        ┌──────────────┐                 ┌───────────────┐
       │                        │    seats     │                 │  passengers   │
       │                        └──────┬───────┘                 └───────────────┘
       │                               │ 1:N                             │
       │                               ▼                                 │
       │                        ┌──────────────┐                         │
       │                        │seat_bookings │ ◄───────────────────────┘
       │                        └──────────────┘
       │ 1:N
       ▼
┌─────────────┐
│ settlements │
└─────────────┘

┌─────────────┐       1:N       ┌──────────────┐       1:N       ┌───────────────┐
│    users    │ ─────────────── │    trips     │ ─────────────── │  checklists   │
└──────┬──────┘                 └──────┬───────┘                 └───────────────┘
       │                               │ 1:N                             │
       │                               ▼                                 ▼
       │                        ┌──────────────┐                 ┌───────────────┐
       │                        │   budgets    │                 │     notes     │
       │                        └──────────────┘                 └───────────────┘
       │ 1:N
       ▼
┌─────────────┐
│  journals   │
└─────────────┘
```

### Verified Schema Tables (49 Tables)

| Category | Table Name | Purpose |
|---|---|---|
| **Identity & Users** | `users` | Traveler accounts, wallet balance, reward points, preferences |
| | `agents` | Tour agencies, business license, KYC status, commission rates |
| | `admins` | Platform administrators and role permissions |
| | `drivers` | Transit drivers, assigned vehicle, license, status |
| | `driver_otps` | Short-lived OTP codes for driver authentication |
| | `otps` | General verification OTPs for traveler phone/email auth |
| **Marketplace & Trips** | `agent_trips` | Published tour packages, pricing, itineraries, seat configurations |
| | `trips` | Collaborative traveler-created multi-day trip plans |
| | `trip_activities` | Catalog of selectable trip activities |
| | `reviews` | Traveler ratings and reviews for tour packages |
| **Bookings & Transit** | `bookings` | Customer trip reservations, status, total amounts |
| | `passengers` | Manifest of individual travelers attached to bookings |
| | `seats` | Coach layout seat definitions |
| | `seat_bookings` | Reserved and locked seat allocations per trip |
| | `bus_types` | Master lookup: coach types (AC Sleeper, Volvo, Semi-Sleeper) |
| | `bus_amenities` | Master lookup: coach amenities (WiFi, Charging, Water) |
| | `hotel_amenities`| Master lookup: hotel amenities (Pool, Breakfast, Spa) |
| | `boarding_passes`| Generated digital boarding pass records and validation tokens |
| **Finance & Ledger** | `payments` | Transaction records, payment gateway order IDs, payment status |
| | `settlements` | Agency financial payouts and platform revenue settlements |
| | `withdrawals` | Agency wallet balance withdrawal requests |
| | `commissions` | Platform commission fee tracking |
| | `coupons` | Promotional discount codes, valid dates, percentage/fixed amounts |
| | `rewards` | Gamified reward points ledger |
| | `referrals` | User-to-user referral tracking |
| | `agent_referrals`| Agency onboarding referral links |
| **Collaboration & Tools**| `budgets` | Group trip expense tracking and member splits |
| | `checklists` | Categorized trip packing checklists |
| | `notes` | Freeform collaborative trip notes |
| | `journals` | Travel diary entries, media links, and memories |
| | `chat_messages` | Live group chat message history |
| | `chat_read_statuses`| Read receipts per member per message |
| | `flights` | Flight tracking records (stubbed backend) |
| **Storage & Governance**| `uploaded_files` | Metadata registry for all S3 uploaded assets and documents |
| | `notifications` | Traveler push notifications |
| | `admin_notifications`| System alerts and KYC submission notifications for admins |
| | `activity_logs` | Audit trail of administrative actions |
| | `legal_documents`| Platform terms of service and privacy policy versions |
| | `legal_acceptance`| User acceptance timestamps for legal documents |
| | `system_settings`| Platform runtime configuration key-value store |
| | `exchange_rate_caches`| Foreign exchange currency conversion rate cache |
| **AI Intelligence** | `travel_intents` | Extracted travel preferences (destinations, budgets, dates) |
| | `chat_history` | Long-term conversational chat history between users and Gemini |
| | `recommendations`| Cached personalized package recommendations |
| | `user_profiles` | Behavioral and travel profile attributes |
| | `user_preferences`| Explicit user travel settings |
| | `chat_analytics` | Usage analytics, token consumption, query volume |
| | `daily_statistics`| Aggregated daily platform metrics |
| | `traveler_search_intents`| Search query tracking for market demand intelligence |

### Connection Pooling & TLS Configuration
- **Node.js (`Backend/config/mysql.js`)**: Connects using `mysql2/promise` with a connection pool (limit: 15 connections, idle timeout: 60s). When `DB_SSL=true`, TLS verification is strictly enforced using `fs.readFileSync(DB_SSL_CA_PATH || '/home/ubuntu/global-bundle.pem')` with `rejectUnauthorized: true`.
- **Python (`ai-service/app/core/database.py`)**: Connects using SQLAlchemy and PyMySQL with an SSL context requiring `ssl.CERT_REQUIRED` and hostname validation.

---

## 10. Authentication and Authorization

TravelLoop V2 implements role-based access control (RBAC) across four user roles:

```
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   Traveler User   │    │   Tour Agency     │    │  Transit Driver   │    │  Platform Admin   │
│   role: "user"    │    │   role: "agent"   │    │   role: "driver"  │    │   role: "ADMIN"   │
└─────────┬─────────┘    └─────────┬─────────┘    └─────────┬─────────┘    └─────────┬─────────┘
          │                        │                        │                        │
          ▼                        ▼                        ▼                        ▼
    authMiddleware         agentAuthMiddleware      driverAuthMiddleware      adminAuthMiddleware
          │                        │                        │                        │
  - Dual JWT / Firebase    - Valid Agency Token     - Valid Driver Token      - Valid Admin Token
  - MySQL `users` lookup   - KYC status checked     - Scoped to driver trip   - Role checked
```

### Implemented Authentication Mechanics
1. **Traveler Authentication (`authMiddleware.js`)**:
   - Accepts custom backend JWT issued during email/password login.
   - Accepts raw Firebase ID tokens from Google OAuth.
   - Decodes token, looks up `users` row in MySQL, and populates `req.user`. If a valid Firebase user does not exist in MySQL, it automatically creates a new row.
2. **Agency Authentication (`agentAuthMiddleware.js` & `kycMiddleware.js`)**:
   - Verifies agency JWT.
   - `checkAgentKYC` blocks unapproved agencies (`status !== 'APPROVED'`) from publishing tour packages or requesting wallet withdrawals.
3. **Driver Authentication (`driverAuthMiddleware.js`)**:
   - Authenticates drivers via 6-digit OTP dispatched to phone or email (`driver_otps`).
   - Restricts access strictly to assigned trip manifests and QR scanning.
4. **Administrator Authentication (`adminAuthMiddleware.js`)**:
   - Authenticates platform administrators against the `admins` table.
   - Auto-bootstraps initial super administrator on server launch if `admins` table is empty (`bootstrapAdmin.js`).

---

## 11. API Architecture & Endpoints

The Express server in `Backend/` serves as the public API Gateway under the `/api` route prefix. The Python AI service is entirely internal and proxied through `/api/ai/*`.

### Key Endpoints Reference

| HTTP Method | Path | Auth Required | Purpose & Description | Source File |
|---|---|---|---|---|
| `GET` | `/api/health` | None | Service liveness and database ping | [`healthRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/healthRoutes.js) |
| `POST` | `/api/auth/register` | None | Register new traveler account | [`authRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/authRoutes.js) |
| `POST` | `/api/auth/login` | None | Traveler authentication via email & password | [`authRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/authRoutes.js) |
| `POST` | `/api/auth/google` | None | Exchange Firebase Google token for JWT | [`authRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/authRoutes.js) |
| `POST` | `/api/auth/send-otp` | None | Dispatch phone/email verification OTP | [`authRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/authRoutes.js) |
| `POST` | `/api/auth/verify-otp` | None | Verify OTP and authenticate user | [`authRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/authRoutes.js) |
| `GET` | `/api/auth/me` | Bearer Token | Fetch current authenticated user record | [`authRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/authRoutes.js) |
| `GET` | `/api/trips/published` | None | Retrieve approved marketplace packages | [`tripRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/tripRoutes.js) |
| `GET` | `/api/trips/published/:id` | None | Detailed package itinerary and amenities | [`tripRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/tripRoutes.js) |
| `POST` | `/api/trips/create` | Bearer Token | Create collaborative custom trip | [`tripRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/tripRoutes.js) |
| `GET` | `/api/seats/:tripId` | None | Fetch coach layout and booked seats | [`seatRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/seatRoutes.js) |
| `POST` | `/api/payment/create-order`| Bearer Token | Initialize Razorpay order & draft booking | [`paymentRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/paymentRoutes.js) |
| `POST` | `/api/payment/verify` | Bearer Token | Verify payment signature and lock seats | [`paymentRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/paymentRoutes.js) |
| `POST` | `/api/boarding/generate-qr`| Bearer Token | Generate QR boarding pass token | [`boardingRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/boardingRoutes.js) |
| `POST` | `/api/upload/presign` | Bearer Token | Generate direct S3 PUT presigned URL | [`uploadRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/uploadRoutes.js) |
| `POST` | `/api/upload/confirm` | Bearer Token | Confirm direct S3 upload & store metadata | [`uploadRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/uploadRoutes.js) |
| `POST` | `/api/upload` | Bearer Token | Backend-buffered multipart upload to S3 | [`uploadRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/uploadRoutes.js) |
| `GET` | `/api/upload/download/:fileId`| Bearer Token | Authorized presigned GET URL for private file | [`uploadRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/uploadRoutes.js) |
| `POST` | `/api/ai/chat` | Bearer Token | Conversational travel assistant via Gemini | [`aiRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/aiRoutes.js) |
| `POST` | `/api/ai/search` | Bearer Token | Semantic RAG package search | [`aiRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/aiRoutes.js) |
| `GET` | `/api/ai/recommendations` | Bearer Token | Personalized package recommendations | [`aiRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/aiRoutes.js) |
| `GET` | `/api/ai/demands` | Agency / Admin | Market demand signals extracted from chat | [`aiRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/aiRoutes.js) |
| `POST` | `/api/driver/login` | None | Driver OTP authentication | [`driverRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/driverRoutes.js) |
| `GET` | `/api/driver/passengers/:tripId`| Driver Token | Passenger manifest for departure | [`driverRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/driverRoutes.js) |
| `POST` | `/api/driver/scan-qr` | Driver Token | Validate boarding pass QR token | [`driverRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/driverRoutes.js) |
| `POST` | `/api/agent/profile/onboarding`| Agent Token | Submit agency KYC verification documents | [`agentRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/agentRoutes.js) |
| `POST` | `/api/agent/trips` | Agent (KYC OK) | Publish new group tour package | [`agentRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/agentRoutes.js) |
| `PATCH`| `/api/admin/agents/:id/status`| Admin Token | Approve or reject agency KYC | [`adminRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/adminRoutes.js) |
| `PATCH`| `/api/admin/trips/:id/approve`| Admin Token | Approve tour package for public view | [`adminRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/adminRoutes.js) |

---

## 12. File Uploads and Media Storage

Storage operations in TravelLoop V2 are implemented using **Amazon S3** (`@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`):

### Storage Architecture
- **Configured Storage Backend**: Amazon S3 in AWS region `ap-south-1`.
- **Target Bucket**: Defined via `AWS_S3_BUCKET` in `Backend/.env` (`traveloop-media`).
- **Object Key Structure**:
  ```text
  traveloop/{folder}/{ownerId}/{timestamp}_{random}_{sanitized_filename}
  ```
- **Visibility & Access Controls**:
  - **Public Files** (`avatar`, `trip_cover`, `general`): Direct HTTPS URLs served via S3 bucket URL or CloudFront domain if configured.
  - **Private Files** (`kyc`, `legal`, `receipt`): Uploaded with private access. Retrieval requires an authorized call to `GET /api/upload/download/:fileId`, which verifies ownership or admin status before issuing a short-lived (1-hour) presigned GET URL.
- **Validation Rules**:
  - Image MIME types: `image/jpeg`, `image/png`, `image/webp`. Max size: 10 MB.
  - Document MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Max size: 15 MB.
- **Metadata Persistence**: Every upload is recorded in the MySQL `uploaded_files` table (`id`, `owner_id`, `object_key`, `original_filename`, `mime_type`, `file_size`, `visibility`, `created_at`).

---

## 13. Configuration and Environment Variables

The table below catalogs platform environment variables. **Never commit actual `.env` files or secret keys to version control.**

| Variable | Used By | Purpose | Required? | Example Value |
|---|---|---|---|---|
| `PORT` | Backend | Express HTTP listen port | No (default: 5000) | `5000` |
| `NODE_ENV` | Backend | Environment flag (`development`, `production`) | Yes | `production` |
| `DB_HOST` | Backend, AI | MySQL hostname | Yes | `127.0.0.1` |
| `DB_PORT` | Backend, AI | MySQL port | Yes | `3306` |
| `DB_NAME` | Backend, AI | Database schema name | Yes | `traveloop` |
| `DB_USER` | Backend, AI | Database username | Yes | `traveloop_app` |
| `DB_PASSWORD` | Backend, AI | Database password | Yes | `your_secure_password` |
| `DB_SSL` | Backend, AI | Enable SSL/TLS for MySQL connection | Yes (in prod) | `true` |
| `DB_SSL_CA_PATH` | Backend, AI | Path to RDS global CA bundle | Yes (if SSL) | `/home/ubuntu/global-bundle.pem` |
| `JWT_SECRET` | Backend | Secret key for signing backend session tokens | Yes | `your_jwt_signing_key` |
| `FIREBASE_PROJECT_ID` | Backend, Frontends | Firebase Project ID | Yes | `traveloop-prod` |
| `FIREBASE_CLIENT_EMAIL` | Backend | Firebase Admin service account email | Yes | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Backend | Firebase Admin private key | Yes | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `AWS_REGION` | Backend, AI | AWS Region for S3 storage | Yes | `ap-south-1` |
| `AWS_S3_BUCKET` | Backend, AI | Target Amazon S3 bucket name | Yes | `traveloop-media` |
| `AWS_ACCESS_KEY_ID` | Backend, AI | AWS IAM access key (fallback for local dev) | Optional | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Backend, AI | AWS IAM secret key (fallback for local dev) | Optional | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `GEMINI_API_KEY` | Backend, AI | Google Gemini API key | Yes | `AIzaSy...` |
| `GEMINI_MODEL` | AI | Target Gemini model name | No | `gemini-flash-latest` |
| `AI_SERVICE_URL` | Backend | Internal URL of Python AI microservice | Yes | `http://127.0.0.1:8000` |
| `REDIS_URL` | Backend, AI | Redis connection URL | Yes | `redis://127.0.0.1:6379/0` |
| `QDRANT_URL` | AI | Qdrant vector database URL | Yes | `http://127.0.0.1:6333` |
| `RAZORPAY_KEY_ID` | Backend, Frontends | Razorpay public key ID | Yes | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Backend | Razorpay private secret for HMAC checks | Yes | `your_razorpay_secret` |
| `ALLOWED_ORIGINS` | Backend | Comma-separated CORS allowed origins | Yes | `https://traveloop.sanjai.online,http://localhost:5173` |
| `ADMIN_EMAIL` | Backend | Email for bootstrap super administrator | Yes | `admin@traveloop.in` |
| `ADMIN_PASSWORD` | Backend | Password for bootstrap super administrator | Yes | `your_secure_admin_password` |
| `VITE_API_URL` | Frontends | Public API Gateway base URL | Yes | `https://api.traveloop.sanjai.online/api` |
| `VITE_FIREBASE_API_KEY` | Frontends | Firebase Web API key | Yes | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontends | Firebase Auth domain | Yes | `traveloop-prod.firebaseapp.com` |

---

## 14. Local Development Setup

### Prerequisites
- **Node.js**: v20.x or v22.x LTS (`npm` v10+)
- **Python**: v3.11.x
- **MySQL**: 8.0+ server running locally or via Docker
- **Redis & Qdrant**: Running locally or via Docker

### Step 1: Clone Repository
```bash
git clone https://github.com/sanjai0305/traveloop_V2.git
cd traveloop_V2
```

### Step 2: Initialize Database and Supporting Services
Start MySQL, Redis, and Qdrant using Docker Compose:
```bash
docker compose up -d mysql redis qdrant
```
Verify containers are healthy:
```bash
docker compose ps
```

### Step 3: Configure Backend & Start Node.js API
```bash
cd Backend
cp .env.example .env
# Edit .env with your local credentials
npm install
npm run dev
```
*The Backend connects to MySQL, seeds master lookups if empty, and listens on `http://localhost:5000`.*

### Step 4: Configure & Start Python AI Microservice
In a new terminal:
```bash
cd ai-service
cp .env.example .env
# Edit .env with your local credentials and GEMINI_API_KEY

# Create and activate virtual environment
# Windows (PowerShell):
python -m venv .venv
.venv\Scripts\Activate.ps1
# Linux / macOS:
# python3 -m venv .venv && source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*The AI Service initializes database connections, connects to Redis and Qdrant, and listens on `http://127.0.0.1:8000`.*

### Step 5: Start Frontend Applications
In separate terminal windows:
```bash
# Traveler Website (Port 5173)
cd user-website && npm install && npm run dev

# Agency Portal (Port 5175)
cd agent-portal && npm install && npm run dev

# Admin Portal (Port 5174)
cd admin-portal && npm install && npm run dev

# Driver Portal (Port 5176)
cd driver-portal && npm install && npm run dev
```

---

## 15. Build, Testing, and Code Quality

### Build Commands
```bash
# Frontend builds (production assets compiled to dist/)
cd user-website  && npm run build
cd agent-portal  && npm run build
cd admin-portal  && npm run build
cd driver-portal && npm run build
```

### Syntax Validation & Linting
```bash
# Validate Backend JavaScript syntax across all source files
cd Backend
node --check server.js
git ls-files "*.js" | ForEach-Object { node --check $_ }

# Validate Python syntax across all AI service files
cd ai-service
git ls-files "*.py" | ForEach-Object { python -m py_compile $_ }

# Lint frontends
cd user-website  && npm run lint
cd agent-portal  && npm run lint
cd driver-portal && npm run lint
```

### Standalone Verification Scripts
The repository includes automated verification scripts inside `Backend/`:
```bash
cd Backend
node verify_apis.js          # Tests core REST endpoints
node verify_admin_portal.js  # Tests admin operations and KYC flow
node verify_budget.js        # Validates budget calculation logic
node verify_chat.js          # Validates real-time socket events
node testReferralFlow.js     # Validates referral codes and rewards
```

---

## 16. Production Deployment Architecture

```
GitHub Repository (main)
         │
         ▼
[GitHub Actions CI/CD] ──── (OIDC: TraveloopGitHubActionsDeployRole) ────► [AWS STS]
         │
         │ Dispatches SSM Command
         ▼
[AWS Systems Manager (SSM)]
         │
         ▼ (AWS-RunShellScript)
[Private AWS EC2 Host]
  ├── Fetch origin/main
  ├── Zero-index loader: mktemp /tmp/traveloop-deploy-ec2.XXXXXX
  ├── Preflight working tree & fast-forward checks
  ├── Restricted backup: chmod 700 /tmp/traveloop_pre_deploy_*
  ├── Fast-forward merge: git merge --ff-only origin/main
  ├── Install dependencies (if package.json or requirements.txt changed)
  ├── Restart systemd services:
  │     ├── systemctl restart traveloop-backend.service
  │     └── systemctl restart traveloop-ai.service
  └── Bounded health checks:
        ├── http://127.0.0.1:5000/api/health (60s timeout)
        └── http://127.0.0.1:8000/health (90s timeout)
```

- **Frontend Deployment**: `user-website` is continuously deployed on **Vercel** (`https://traveloop.sanjai.online`).
- **Backend & AI Hosting**: Co-located on a private AWS EC2 instance in region `ap-south-1`.
- **Process Supervision**: Managed by Linux **systemd** services (`traveloop-backend.service` and `traveloop-ai.service`).
- **Deployment Safety Gate**: Governed by the GitHub repository variable `ENABLE_EC2_DEPLOY`. Deployment does not trigger unless this gate is explicitly set to `true`.

---

## 17. CI/CD Pipeline (GitHub Actions + AWS OIDC + SSM)

The CI/CD pipeline is defined in [`.github/workflows/deploy-ec2.yml`](file:///d:/travel/traveloop_V2/.github/workflows/deploy-ec2.yml) and executed by [`scripts/deploy-ec2.sh`](file:///d:/travel/traveloop_V2/scripts/deploy-ec2.sh):

### Pipeline Execution Stages
1. **Trigger & Filtering**:
   - Runs on push to the `main` branch or manual `workflow_dispatch`.
   - `dorny/paths-filter@v3` detects changes across `Backend/**`, `ai-service/**`, and `scripts/**`.
2. **CI Syntax Validation**:
   - Sets up Node.js 22 and runs `node --check` across all JavaScript source files.
   - Sets up Python 3.11 and runs `python -m py_compile` across all Python source files.
3. **AWS OIDC Authentication**:
   - Uses `aws-actions/configure-aws-credentials@v4` with GitHub OIDC token.
   - Assumes `TraveloopGitHubActionsDeployRole` (`vars.AWS_ROLE_ARN`) without storing long-lived AWS keys in GitHub.
4. **SSM Execution & Script Loading**:
   - Dispatches `AWS-RunShellScript` targeting `vars.EC2_INSTANCE_ID`.
   - The bootstrap script fetches `origin/main` and streams the deployment script into a temporary file using `mktemp` and `git show origin/main:scripts/deploy-ec2.sh | tr -d '\r'`. This ensures the working tree is not dirtied during bootstrap.
5. **Preflight Safety Guards**:
   - `git diff --quiet`: Aborts immediately if tracked files on EC2 have uncommitted modifications.
   - Fast-forward check: Verifies that EC2 local HEAD is an ancestor of `origin/main` (`LOCAL_COMMIT == MERGE_BASE`). Hard resets are never performed.
6. **Credential Protection**:
   - Creates a temporary backup directory (`chmod 700`) and preserves `Backend/.env`, `serviceAccountKey.json`, and `ai-service/.env` (`chmod 600`).
7. **Service Restart & Health Verification**:
   - Restarts `traveloop-backend.service` and `traveloop-ai.service` via `systemctl`.
   - Executes bounded health check loops (30 attempts at 2s intervals for backend; 30 attempts at 3s intervals for AI service).
   - If either health check fails, the script dumps service logs via `journalctl` and exits with an error.

---

## 18. Networking, Observability, and Security

### Security & Ingress Controls
- **Private Subnet Placement**: The EC2 instance and RDS MySQL database reside within private VPC subnets. Public HTTP access is routed through managed load balancers or CloudFront reverse proxies.
- **Database TLS Protection**: All connections between the application tiers and RDS use TLS with Amazon's global trust bundle (`global-bundle.pem`).
- **CORS Protection**: The Express gateway enforces allowed origins matching `ALLOWED_ORIGINS` and rejects unlisted origins in production.
- **Rate Limiting**:
  - Global API: 200 requests per 15 minutes.
  - Authentication endpoints: 20 requests per 15 minutes.
  - AI endpoints: 40 chat requests and 60 search requests per 15 minutes.
- **Input Sanitization**: `sanitizeInput` middleware recursively strips dangerous scripts and HTML tags from request bodies.
- **Zero Committed Secrets**: `.gitignore` strictly ignores `.env`, `*.pem`, `*.key`, and `serviceAccountKey.json`.

---

## 19. Monitoring and Health Checks

### Health Endpoints
- **Backend API**: `GET /api/health`
  - URL: `http://127.0.0.1:5000/api/health`
  - Returns: `{ "status": "UP", "timestamp": "...", "database": "connected" }`
- **AI Microservice**: `GET /health`
  - URL: `http://127.0.0.1:8000/health`
  - Returns: `{ "status": "healthy", "mysql": true, "redis": true, "qdrant": true, "gemini": true }`
- **S3 Storage Subsystem**: `GET /api/upload/health`
  - Returns S3 bucket reachability and configuration status.

### Production Diagnostics Commands (EC2)
```bash
# Inspect Backend service state and logs
sudo systemctl status traveloop-backend.service
sudo journalctl -u traveloop-backend.service -n 100 -f

# Inspect AI microservice state and logs
sudo systemctl status traveloop-ai.service
sudo journalctl -u traveloop-ai.service -n 100 -f

# Test internal health endpoints locally
curl -i http://127.0.0.1:5000/api/health
curl -i http://127.0.0.1:8000/health
```

---

## 20. Operations and Troubleshooting Guide

| Issue / Symptom | Root Cause | Safe Diagnostic & Resolution |
|---|---|---|
| **Duplicate `/api/api/` in frontend requests** | `VITE_API_URL` has trailing `/api` and code appends another `/api` | Resolved automatically by `getApiUrl()` in `src/utils/api.js` and `apiClient` interceptors. Verify `VITE_API_URL=https://api.traveloop.sanjai.online/api` on Vercel. |
| **CORS blocked in browser console** | Origin not present in `ALLOWED_ORIGINS` | Add the frontend domain (e.g., `https://traveloop.sanjai.online`) to `ALLOWED_ORIGINS` in `Backend/.env` and restart backend. |
| **JWT expired / 401 Unauthorized** | Session token expired or invalid secret | `apiClient` automatically dispatches `auth:expired` event to redirect traveler to login. Check `JWT_SECRET` in `Backend/.env`. |
| **Database connection refused (`ECONNREFUSED`)** | MySQL is stopped or host/port misconfigured | Check `sudo systemctl status mysql` or verify RDS security group allows inbound port 3306 from the EC2 security group. |
| **RDS TLS certificate verification failed** | Missing CA certificate or wrong path | Verify `/home/ubuntu/global-bundle.pem` exists on EC2 and matches `DB_SSL_CA_PATH`. Do not disable TLS in production. |
| **S3 Access Denied on file upload** | IAM role or credentials lack `s3:PutObject` | Verify EC2 IAM instance profile has permissions for `arn:aws:s3:::traveloop-media/*`. Test using `GET /api/upload/health`. |
| **AI service health check timeout (90s)** | Large embedding model downloading or loading | `BAAI/bge-small-en-v1.5` loads during startup. Inspect logs with `sudo journalctl -u traveloop-ai.service -n 50`. |
| **SSM Run Command failed in CI/CD** | EC2 working tree dirty or diverged | Check SSM output in GitHub Actions. The script aborts if tracked files have uncommitted edits. Review Git status on the instance. |
| **GitHub Actions OIDC authentication failure** | Role trust policy does not match repo | Verify `TraveloopGitHubActionsDeployRole` trust policy includes `repo:sanjai0305/traveloop_V2:ref:refs/heads/main`. |
| **Backend fails on startup (`EADDRINUSE`)** | Another process is holding port 5000 | Find process: `sudo lsof -i :5000` or `sudo ss -lptn 'sport = :5000'`. Restart via `sudo systemctl restart traveloop-backend.service`. |

---

## 21. Known Limitations and Stubs

1. **AviationStack Flight Tracking**: [`flightRoutes.js`](file:///d:/travel/traveloop_V2/Backend/routes/flightRoutes.js) endpoints exist, but `flightController.js` currently serves mock schedules until a live API key and subscription are activated.
2. **Receipt OCR Scanner**: `tesseract.js` is installed in `package.json`, but `scannerRoutes.js` currently responds with a mock payload while server-side worker performance is being optimized.
3. **Chat Reactions & Editing**: WebSocket messaging and read receipts are fully operational; message editing and reaction endpoints return stub responses.
4. **Foreign Exchange Rates**: `exchange_rate_caches` falls back to predefined static base rates when external forex feeds are unreachable.

---

## 22. Future Improvements and Roadmap

- [ ] **Predictive AI Dynamic Pricing**: Dynamic group tour seat pricing based on real-time reservation velocity.
- [ ] **Live Driver GPS Telemetry**: Real-time vehicle location streaming to traveler maps via WebSockets.
- [ ] **Offline PWA Manifests**: Offline passenger verification cache for transit drivers operating in mountainous low-connectivity regions.
- [ ] **Automated End-to-End Testing**: Playwright integration suites covering the full booking and boarding lifecycle.
- [ ] **CloudWatch Container Insights & Alarms**: Automated metric alerting for high CPU, memory, and database connection spikes.

---

## 23. Contribution Guidelines

1. **Fork the Repository** and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Adhere to Code Standards**:
   - Use ES Modules (`import`/`export`) in Backend.
   - Run syntax checks (`node --check`) and linters (`npm run lint` / `oxlint`) before committing.
   - Never commit `.env` files or credentials.
3. **Submit a Pull Request**:
   - Target the `main` branch. Provide a comprehensive summary of changes, tested flows, and any schema migrations.

---

## 24. License

Distributed under the **MIT License**. See [`LICENSE`](file:///d:/travel/traveloop_V2/LICENSE) for details.

---

## 25. Project Metadata and Author

- **Project Name:** TravelLoop V2
- **Author:** Sanjai R.
- **Repository:** [https://github.com/sanjai0305/traveloop_V2](https://github.com/sanjai0305/traveloop_V2)
- **Live Traveler Portal:** [https://traveloop.sanjai.online](https://traveloop.sanjai.online)
- **Live API Endpoint:** [https://api.traveloop.sanjai.online](https://api.traveloop.sanjai.online)