# 🚀 Traveloop V2 - AI Powered Travel Ecosystem

An enterprise-grade travel platform featuring AI itinerary planning, traveler booking, admin management, travel agent services, and driver operations.

---

# 📋 Prerequisites

Before running the project, make sure you have installed:

- Node.js 22+
- npm
- MongoDB (Local or Atlas)
- Git

---

# 📂 Project Structure

```
traveloop_V2
│
├── Backend
├── traveloop-frontend-application
├── traveloop-frontend-websites
├── admin-portal
├── agent-portal
├── driver-portal
├── shared-ui
└── project-resources
```

---

# 🛠️ Development Services

| Service | Directory | Install | Run |
|----------|-----------|---------|-----|
| Backend API | `Backend` | `npm install` | `node server.js` |
| Traveler Application | `traveloop-frontend-application` | `npm install --legacy-peer-deps` | `npm run dev` |
| Public Website | `traveloop-frontend-websites` | `npm install` | `npm run dev` |
| Admin Portal | `admin-portal` | `npm install` | `npm run dev` |
| Agent Portal | `agent-portal` | `npm install` | `npm run dev` |
| Driver Portal | `driver-portal` | `npm install` | `npm run dev` |

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
cd traveloop-frontend-application

npm install --legacy-peer-deps

npm run dev
```

---

## Terminal 3 — Public Website

```bash
cd traveloop-frontend-websites

npm install

npm run dev
```

---

## Terminal 4 — Admin Portal

```bash
cd admin-portal

npm install

npm run dev
```

---

## Terminal 5 — Agent Portal

```bash
cd agent-portal

npm install

npm run dev
```

---

## Terminal 6 — Driver Portal

```bash
cd driver-portal

npm install

npm run dev
```

---

# 🏗️ Production Build

## Traveler Application

```bash
cd traveloop-frontend-application

npm run build
```

## Public Website

```bash
cd traveloop-frontend-websites

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
