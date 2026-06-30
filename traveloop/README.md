# Traveloop ✈️
### *Your Premium Full-Stack Collaborative Travel Planner*

---

[![Vercel Deployment](https://img.shields.io/badge/depoly-Vercel-black?logo=vercel)](https://traveloop.zapto.org)
[![React Version](https://img.shields.io/badge/react-19-blue?logo=react)](https://react.dev)
[![Vite Bundler](https://img.shields.io/badge/bundler-Vite--8-purple?logo=vite)](https://vite.dev)
[![Capacitor Wrapper](https://img.shields.io/badge/wrapper-Capacitor--8-blue?logo=capacitor)](https://capacitorjs.com)
[![Database](https://img.shields.io/badge/db-MongoDB--Atlas-green?logo=mongodb)](https://mongodb.com)
[![Realtime Database](https://img.shields.io/badge/sync-Firebase--RTDB-orange?logo=firebase)](https://firebase.google.com)

**Traveloop** is a premium, full-stack, mobile-friendly travel planning application built using the MERN stack integrated with Firebase real-time services. It solves the issue of travel planning fragmentation by unifying itinerary scheduling, multi-currency budget splitting, smart checklists, receipt scanning (OCR), and flight tracking into a single collaborative interface.

---

## 🌟 Key Features

* **Gamified Planner Profile**: Earn XP, streaks, levels, and achievements (Travel Score) as you plan trips.
* **Real-Time Collaboration Chat**: Discuss plans and view who is active on-the-go with real-time presence and typing indicators.
* **Smart Itinerary Planner**: Day-by-day itinerary scheduler with activity logs tracking collaborator changes.
* **Multi-Currency Expense Splitter & Settlement**: Record shared expenses, convert currencies automatically, and settle debts.
* **Receipt OCR Scanner**: Take photos of paper receipts; the system extracts the amount, vendor, category, and date.
* **Live Flight Tracking & Alerts**: Log flight numbers and track gate changes, delays, terminals, and statuses.
* **Smart Explore & Weather Forecasts**: Search cities to discover top nearby attractions and check 3-day weather warnings.
* **Contextual AI Travel Assistant**: Ask questions (e.g., "Suggest dinner spots for Day 2") based on your active trip context.
* **Travel Journal**: Save daily memories and log photos of your trip.
* **Itinerary Report PDF Export**: Generate and print structured trip itinerary reports.

---

## 🛠️ Technology Stack

* **Frontend Client**: React.js (v19), Vite (v8), Tailwind CSS (v3), Framer Motion (v12), Lucide Icons
* **Mobile App Wrapper**: Capacitor (v8)
* **Backend Server**: Node.js Express (v5)
* **Databases**: MongoDB Atlas (Transactional data via Mongoose v9) & Firebase Firestore / Realtime Database (Real-time chat and presence)
* **AI Engine**: Google Gemini 1.5 Flash API
* **Receipt OCR Scanner**: Tesseract.js
* **Live Flight Engine**: AviationStack API
* **Weather Service**: Open-Meteo API
* **Email Mailer**: Nodemailer (OAuth2 Client)

---

## 📁 Folder Structure

```
Trip-Planner-Hackathon/               # Repository Root
├── Backend/                         # Express API Server Application
│   ├── config/                      # Database & Firebase server initializations
│   ├── controllers/                 # HTTP Route Controllers (AI, Auth, Budget, etc.)
│   ├── middleware/                  # Request pipeline Middlewares (JWT, Sanitize)
│   ├── models/                      # MongoDB Database Mongoose Schemas
│   ├── routes/                      # Route mappings linking to controllers
│   ├── services/                    # Email, Gmail, and budget sync handlers
│   └── server.js                    # Backend entry file
└── traveloop/                       # Frontend Web Application (React + Vite)
    ├── android/                     # Compiled Android Capacitor project
    ├── src/                         # React Application Source
    │   ├── components/              # UI Components (Buttons, Dialogs, Cards)
    │   ├── context/                 # Context Providers (Auth, Trip contexts)
    │   ├── layouts/                 # Page layouts (MainLayout, AuthLayout)
    │   ├── pages/                   # Frontend Page Layouts (Dashboard, Itinerary)
    │   ├── routes/                  # Client routing files
    │   └── utils/                   # Shared client helpers (API URL resolvers)
    └── package.json                 # Node package configuration
```

---

## 🚀 Installation & Local Development Setup

### Prerequisites
* **Node.js**: v18 or later
* **MongoDB**: A running local instance or MongoDB Atlas account
* **Firebase**: A configured Firebase project with Web App client keys

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Trip-Planner-Hackathon.git
cd Trip-Planner-Hackathon
```

### 2. Configure Backend Services
Go to the `Backend` directory and install dependencies:
```bash
cd Backend
npm install
```
Create a `.env` file inside the `Backend` folder:
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_signing_secret
GEMINI_API_KEY=your_google_gemini_api_key
AVIATIONSTACK_API_KEY=your_aviation_stack_key
GOOGLE_MAPS_API_KEY=your_google_places_api_key
GOOGLE_SENDER_EMAIL=your_sender_gmail_address
GOOGLE_CLIENT_ID=your_gmail_oauth_client_id
GOOGLE_CLIENT_SECRET=your_gmail_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_gmail_oauth_refresh_token
# Add Firebase config variables:
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_DATABASE_URL=...
```

### 3. Configure Frontend Client
Go to the `traveloop` directory and install dependencies:
```bash
cd ../traveloop
npm install
```
Create a `.env` file inside the `traveloop` folder:
```bash
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_places_api_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_DATABASE_URL=...
```

---

## 🏃 Running Instructions

### Start Backend Server
From the `Backend` folder:
```bash
npm run dev
```
The server starts on `http://localhost:5000`.

### Start Frontend Client
From the `traveloop` folder:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🔨 Build & Deployment

### Build the Web App Bundle
```bash
cd traveloop
npm run build
```
This generates static web bundles under the `/dist` directory.

### Compile for Mobile (Android/iOS)
Using Capacitor, sync the static assets to build a mobile bundle:
```bash
npx cap sync
npx cap open android
```
This opens the project inside Android Studio for compiling `.apk` or `.aab` packages.

### Vercel Deployment
To deploy both frontend and backend serverless endpoints, deploy via the Vercel CLI or link your repository to the Vercel Dashboard, specifying `Backend/server.js` and `traveloop` as individual deployment projects.

---

## 🚀 Roadmap

* **Version 1.0 (Current)**: Itineraries, Multi-currency ledgers, Chat collaboration, Weather forecast warnings, OCR receipt scanner.
* **Version 2.0**: Offline sync via IndexedDB, push notification indicators, and calendar integration.
* **Version 3.0**: AI travel routing maps, Stripe/UPI integration, and flight booking portals.

---

## 📝 License
Distributed under the ISC License. See `LICENSE` for more information.
