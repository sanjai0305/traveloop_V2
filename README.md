# 🚀 Traveloop V2 - AI Powered Travel Ecosystem

An enterprise-grade travel platform featuring AI itinerary planning, traveler booking, admin management, travel agent services, and driver operations.

---

# 📋 Prerequisites

Before running the project, make sure you have installed:

- Node.js 22+
- npm
- MongoDB (Local or Atlas)
- Git
- Docker Desktop (for Dockerized ecosystem execution)

---

# 🐳 Docker Quick Start

The entire Traveloop V2 ecosystem (Backend, 5 Frontends, Redis, MongoDB) can be run with **one command**.

### Start (Windows)
```cmd
.\start.bat
```
Or manually using Docker Compose:
```bash
docker compose up -d --build
```

### Stop
```cmd
.\stop.bat
```
Or manually:
```bash
docker compose down
```

### View Logs & Status
```bash
# Stream all service logs
docker compose logs -f

# Stream backend logs only
docker compose logs -f backend

# Check status of running containers
docker compose ps
```

### Docker Ecosystem Port Mappings
| Service | Host URL | Container Port |
|---------|----------|----------------|
| Backend API | http://localhost:5000 | `5000` |
| Admin Portal | http://localhost:3001 | `5174` |
| Agent Portal | http://localhost:3002 | `5182` |
| Driver Portal | http://localhost:3003 | `5183` |
| User Application | http://localhost:3004 | `5173` |
| User Website | http://localhost:3005 | `5174` |
| Redis | localhost:6379 | `6379` |
| MongoDB | localhost:27017 | `27017` |


---

# 📂 Project Structure

```
traveloop_V2
│
├── admin-portal
├── agent-portal
├── driver-portal
├── project-resources
│   ├── legal-site
│   └── shared-ui
├── user-application
└── user-website
```

---

# 🛠️ Development Services

| Service | Directory | Install | Run | URL |
|----------|-----------|---------|-----|-----|
| Backend API | `Backend` | `npm install` | `node server.js` | `http://localhost:5000` |
| Traveler Application | `user-application` | `npm install --legacy-peer-deps` | `npm run dev` | `http://localhost:5173` |
| Public Website | `user-website` | `npm install` | `npm run dev` | `http://localhost:5174` |
| Admin Portal | `admin-portal` | `npm install` | `npm run dev` | `http://localhost:5175` |
| Agent Portal | `agent-portal` | `npm install` | `npm run dev` | `http://localhost:5176` |
| Driver Portal | `driver-portal` | `npm install` | `npm run dev` | `http://localhost:5177` |

---

# 💻 Local Development

To run the complete platform, open **6 terminal windows**.

---

## Terminal 1 — Backend

```bash
cd Backend

npm install

node server.js
```

Backend API

```
http://localhost:5000
```

---

## Terminal 2 — Traveler Application

```bash
cd user-application

npm install --legacy-peer-deps

npm run dev
```

Traveler Application

```
http://localhost:5173
```

---

## Terminal 3 — Public Website

```bash
cd user-website

npm install

npm run dev
```

Public Website

```
http://localhost:5174
```

---

## Terminal 4 — Admin Portal

```bash
cd admin-portal

npm install

npm run dev
```

Admin Portal

```
http://localhost:5175
```

---

## Terminal 5 — Agent Portal

```bash
cd agent-portal

npm install

npm run dev
```

Agent Portal

```
http://localhost:5176
```

---

## Terminal 6 — Driver Portal

```bash
cd driver-portal

npm install

npm run dev
```

Driver Portal

```
http://localhost:5177
```

---

# 🏗️ Production Build

## Traveler Application

```bash
cd user-application

npm run build
```

## Public Website

```bash
cd user-website

npm run build
```

## Admin Portal

```bash
cd admin-portal

npm run build
```

## Agent Portal

```bash
cd agent-portal

npm run build
```

## Driver Portal

```bash
cd driver-portal

npm run build
```

---

# 📦 Tech Stack

- React.js
- Vite
- Node.js
- Express.js
- MongoDB
- Firebase
- Socket.io
- Tailwind CSS

---

# ✨ Features

- 🤖 AI Trip Planner
- 🧳 Traveler Booking Platform
- 🌐 Public Marketing Website
- 👨‍💼 Admin Dashboard
- 🏢 Agent Portal
- 🚖 Driver Portal
- 🔐 Firebase Authentication
- 📍 Google Maps Integration
- 💬 Real-time Socket.io Communication
- 📱 Responsive UI
- ☁️ Cloud Ready Architecture

---

# 🔧 Environment Variables

Create a `.env` file inside the required projects.

### Backend

```env
PORT=5000
MONGO_URI=
JWT_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

### Frontend

```env
VITE_API_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

# 👨‍💻 Author

**Sanjai R**

GitHub: https://github.com/sanjai0305

---

# 📄 License

MIT License
