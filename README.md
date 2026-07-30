# 🚀 Traveloop V2 - Enterprise Travel Platform

## Prerequisites

- Node.js 22+
- npm
- MongoDB (Local or Atlas)
- Git

---

## 🛠️ Development Port Allocation

All development servers run on dedicated ports:

| Application / Portal | Directory | Command | Port URL |
| :--- | :--- | :--- | :--- |
| **Backend API** | `Backend` | `npm run dev` | `http://localhost:5000` |
| **Traveloop Website** | `traveloop-website` | `npm run dev` | `http://localhost:5180` |
| **Admin Portal** | `admin-portal` | `npm run dev` | `http://localhost:5181` |
| **Agent Portal** | `agent-portal` | `npm run dev` | `http://localhost:5182` |
| **Driver Portal** | `driver-portal` | `npm run dev` | `http://localhost:5183` |

---

## 💻 Local Development Workflow

To start the full platform, open **5 terminal windows**:

### Terminal 1 — Backend
```bash
cd Backend
npm install
npm run dev
```

### Terminal 2 — Traveloop Website
```bash
cd traveloop-website
npm install
npm run dev
```

### Terminal 3 — Admin Portal
```bash
cd admin-portal
npm install
npm run dev
```

### Terminal 4 — Agent Portal
```bash
cd agent-portal
npm install
npm run dev
```

### Terminal 5 — Driver Portal
```bash
cd driver-portal
npm install
npm run dev
```

---

## 📦 Project Structure

```
traveloop_V2
│
├── Backend                 # Express REST API & Socket.io server
├── traveloop-website       # Traveler booking portal & itinerary builder
├── admin-portal            # Platform admin management portal
├── agent-portal            # Travel agency & package seller portal
├── driver-portal           # Driver trip assignment portal
├── shared-ui               # Shared Design System tokens & components
└── project-resources       # Project documentation & reference specs
```

---

## 🏗️ Production Build

To build all frontend portals for production:

```bash
# Traveloop Website
cd traveloop-website && npm run build

# Admin Portal
cd ../admin-portal && npm run build

# Agent Portal
cd ../agent-portal && npm run build

# Driver Portal
cd ../driver-portal && npm run build
```
