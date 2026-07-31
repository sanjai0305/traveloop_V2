# 🚀 Traveloop V2 - AI Powered Travel Ecosystem

Traveloop V2 is a full-stack travel ecosystem consisting of a Traveler Application, Public Website, Admin Portal, Agent Portal, Driver Portal, and a centralized Backend API.

---

## 📂 Project Structure

```text
traveloop_V2/
│
├── Backend/                 # Node.js + Express API
├── user-application/        # Main Traveler Application
├── user-website/            # Public Website
├── admin-portal/            # Admin Dashboard
├── agent-portal/            # Travel Agent Portal
├── driver-portal/           # Driver Portal
│
├── project-resources/
│   ├── legal-site/
│   └── shared-ui/
│
├── LICENSE
└── README.md
```

---

# 📋 Prerequisites

Install the following before running Traveloop V2:

- Node.js 22+
- npm
- Git
- MongoDB Atlas or MongoDB Local

Check installation:

```powershell
node --version
npm --version
git --version
```

---

# ⚡ First-Time Setup

After cloning the repository:

```powershell
git clone https://github.com/sanjai0305/traveloop_V2.git

cd traveloop_V2
```

Install dependencies for each application.

## Backend

```powershell
cd Backend
npm install
cd ..
```

## Traveler Application

```powershell
cd user-application
npm install --legacy-peer-deps
cd ..
```

## Public Website

```powershell
cd user-website
npm install
cd ..
```

## Admin Portal

```powershell
cd admin-portal
npm install
cd ..
```

## Agent Portal

```powershell
cd agent-portal
npm install
cd ..
```

## Driver Portal

```powershell
cd driver-portal
npm install
cd ..
```

> `npm install` is normally required only after cloning the repository or when dependencies/package files change.

---

# ▶️ Run Traveloop V2

Traveloop consists of multiple independent services.

For local development, open separate terminals from the repository root.

---

## Terminal 1 — Backend API

```powershell
cd Backend
node server.js
```

Backend:

```text
http://localhost:5000
```

The backend should normally be started first.

---

## Terminal 2 — Traveler Application

```powershell
cd user-application
npm run dev
```

Traveler Application:

```text
http://localhost:5173
```

---

## Terminal 3 — Public Website

```powershell
cd user-website
npm run dev
```

Public Website:

```text
http://localhost:5174
```

---

## Terminal 4 — Admin Portal

```powershell
cd admin-portal
npm run dev
```

Admin Portal:

```text
http://localhost:5175
```

---

## Terminal 5 — Agent Portal

```powershell
cd agent-portal
npm run dev
```

Agent Portal:

```text
http://localhost:5176
```

---

## Terminal 6 — Driver Portal

```powershell
cd driver-portal
npm run dev
```

Driver Portal:

```text
http://localhost:5177
```

---

# 🌐 Local Development URLs

| Application | URL |
|---|---|
| Backend API | `http://localhost:5000` |
| Traveler Application | `http://localhost:5173` |
| Public Website | `http://localhost:5174` |
| Admin Portal | `http://localhost:5175` |
| Agent Portal | `http://localhost:5176` |
| Driver Portal | `http://localhost:5177` |

---

# ⚡ Daily Development

After dependencies have already been installed, you DO NOT need to run `npm install` every time.

Simply start the required services.

### Backend

```powershell
cd Backend
node server.js
```

### Traveler Application

```powershell
cd user-application
npm run dev
```

### Public Website

```powershell
cd user-website
npm run dev
```

### Admin Portal

```powershell
cd admin-portal
npm run dev
```

### Agent Portal

```powershell
cd agent-portal
npm run dev
```

### Driver Portal

```powershell
cd driver-portal
npm run dev
```

---

# 🎯 Run Only What You Need

You do not always need to run all six services.

For example, to work only on the Traveler Application:

### Terminal 1

```powershell
cd Backend
node server.js
```

### Terminal 2

```powershell
cd user-application
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

If working on the Public Website:

```powershell
cd Backend
node server.js
```

and in another terminal:

```powershell
cd user-website
npm run dev
```

Open:

```text
http://localhost:5174
```

---

# 🔄 Pull Latest Changes

Before starting development on another machine or after repository updates:

```powershell
git pull origin main
```

If any `package.json` or `package-lock.json` files changed, reinstall dependencies for the affected application.

Example:

```powershell
cd user-application
npm install --legacy-peer-deps
npm run dev
```

---

# 🔧 Environment Variables

Each application may contain its own `.env` configuration.

Never commit production secrets or private credentials.

## Backend Example

```env
PORT=5000

MONGO_URI=
JWT_SECRET=

FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

## Frontend Example

```env
VITE_API_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Environment variable requirements may differ between individual frontend applications.

---

# 🏗️ Production Build

Before deployment, verify that each frontend builds successfully.

## Traveler Application

```powershell
cd user-application
npm run build
```

## Public Website

```powershell
cd user-website
npm run build
```

## Admin Portal

```powershell
cd admin-portal
npm run build
```

## Agent Portal

```powershell
cd agent-portal
npm run build
```

## Driver Portal

```powershell
cd driver-portal
npm run build
```

Successful Vite builds are generated inside each application's:

```text
dist/
```

directory.

---

# 🧪 Troubleshooting

## `Could not read package.json`

Example:

```text
npm error code ENOENT
npm error Could not read package.json
```

You are most likely running npm from the wrong directory.

Check:

```powershell
Get-Location
```

Then enter the required application directory.

Example:

```powershell
cd user-application
npm run dev
```

---

## `Missing script: dev`

Verify that you are inside the correct project:

```powershell
Test-Path .\package.json
```

Expected:

```text
True
```

Then inspect available scripts:

```powershell
npm run
```

---

## Module / Dependency Error

For most applications:

```powershell
npm install
```

For the Traveler Application:

```powershell
npm install --legacy-peer-deps
```

Then:

```powershell
npm run dev
```

---

## Port Already in Use

Check which process is using a port.

Example for port `5173`:

```powershell
netstat -ano | findstr :5173
```

Terminate the required process only if appropriate:

```powershell
taskkill /PID <PID> /F
```

---

# 📦 Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Firebase
- Google Maps
- Socket.io Client

### Backend

- Node.js
- Express.js
- MongoDB
- Firebase Admin
- Socket.io

### Platform

- Traveler Application
- Public Website
- Admin Portal
- Agent Portal
- Driver Portal

---

# ✨ Core Features

- 🤖 AI Trip Planning
- 🗺️ Itinerary Builder
- 🧳 Traveler Booking
- 🏨 Travel Services
- 📍 Google Maps Integration
- 💬 Real-Time Trip Communication
- 👥 Trip Collaboration
- 👨‍💼 Admin Management
- 🏢 Travel Agent Portal
- 🚖 Driver Portal
- 🔐 Firebase Authentication
- 📱 Mobile Responsive Traveler Application
- 🌐 Public Travel Website

---

# 📁 Project Resources

Supporting resources are located inside:

```text
project-resources/
```

Including:

```text
project-resources/
├── legal-site/
└── shared-ui/
```

These directories are supporting project resources and should not be confused with the primary runtime applications.

---

# 🚨 Important

Do not run:

```powershell
npm install
npm run dev
```

directly from:

```text
traveloop_V2/
```

unless a root-level npm workspace is intentionally configured.

Always enter the required application directory first.

Example:

```powershell
cd user-application
npm run dev
```

---

# 👨‍💻 Author

**Sanjai R**

GitHub: `sanjai0305`

---

# 📄 License

This project is licensed under the MIT License.