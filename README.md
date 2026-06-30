# 🌍 Traveloop V2 🚀

### AI-Powered Travel Planning & Intelligent Booking Ecosystem

<p align="center">

![React](https://img.shields.io/badge/React-19-blue)
![NodeJS](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success)
![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black)
![License](https://img.shields.io/badge/License-MIT-purple)

</p>

Traveloop V2 is an AI-powered travel platform designed to connect **Travelers**, **Travel Agencies**, **Drivers**, and **Administrators** within a unified real-time ecosystem.

The platform combines intelligent trip planning, dynamic itinerary generation, live trip coordination, digital boarding passes, realtime messaging, AI assistance, and operational dashboards into a single scalable architecture.

---

# ✨ Key Features

### 🧠 AI Travel Assistant

* Smart itinerary generation
* Destination recommendations
* Context-aware travel suggestions
* Packing assistance
* Budget optimization
* Local activity discovery

### 🎫 Digital Boarding System

* Boarding window control
* QR boarding passes
* Driver-side scanning
* Live passenger verification
* Realtime status synchronization

### 💬 Group Collaboration

* Group chat
* Driver announcements
* Live notifications
* Passenger discussions
* Presence tracking
* Realtime updates

### 📊 Operational Dashboards

* Trip monitoring
* Passenger manifests
* Revenue analytics
* Seat occupancy
* Driver assignments
* Booking management

### 📍 Driver Experience

* Assigned trip management
* Boarding controls
* Delay notifications
* Pickup coordination
* QR scanning
* Alert broadcasting

---

# 🏗 Architecture & Modules

Traveloop V2 follows a **Micro Frontend Architecture** consisting of multiple independent portals.

## Traveler Portal (`traveloop`)

Traveler-facing mobile-first application.

Features include:

* AI-generated itineraries
* Budget planning
* Expense tracking
* Weather updates
* Boarding passes
* Travel journals
* Packing checklists
* Group chats
* Driver updates
* Smart recommendations

---

## Agent Portal (`agent-portal`)

Management dashboard for travel agencies.

Capabilities:

* Package creation
* Trip scheduling
* Seat configuration
* Passenger management
* Pricing controls
* Driver assignment
* Revenue monitoring
* Export reports
* Booking analytics

---

## Driver Portal (`driver-portal`)

Operational interface for trip drivers.

Features:

* Assigned departures
* Boarding activation
* Passenger verification
* QR scanner
* Delay notifications
* Alert system
* Pickup announcements
* Live trip updates

---

## Admin Portal (`admin-portal`)

System administration dashboard.

Capabilities:

* User management
* Agency approvals
* Driver verification
* Commission settings
* Analytics
* Platform monitoring
* Logs management
* Configuration controls

---

## Backend Server (`Backend`)

Central API gateway powering all portals.

Technology:

* Express.js
* Socket.io
* JWT Authentication
* MongoDB
* Firebase
* Realtime Events

---

# 🏛 System Architecture

```text
Traveler Portal
Agent Portal
Driver Portal
Admin Portal
        │
        ▼

Backend API Gateway
(Express + Socket.io)

        │

─────────────────────────

MongoDB Atlas

Firestore

Realtime Database

Cloud Storage

─────────────────────────

Google Maps API

Open Meteo API

Mail Services

AI Engine

Notification Services
```

---

# 🛠 Tech Stack

## Frontend

* React
* Vite
* TailwindCSS
* Framer Motion
* React Router
* Lucide Icons

## Backend

* Node.js
* Express.js
* Socket.io
* JWT Authentication
* REST APIs

## Database

* MongoDB Atlas
* Mongoose
* Firestore
* Realtime Database
* Firebase Storage

## Authentication

* JWT
* Firebase Auth
* Anonymous Auth
* Role Based Access Control

## APIs

* Open Meteo API
* Geocoding API
* Google Maps API

---

# 🚀 Getting Started

## Prerequisites

Install the following:

* Node.js (v18+)
* MongoDB Atlas
* Firebase Project
* Git

---

## Clone Repository

```bash
git clone https://github.com/sanjai0305/traveloop_V2.git

cd traveloop_V2
```

---

## Install Dependencies

### Backend

```bash
cd Backend

npm install
```

### Traveler Application

```bash
cd ../traveloop

npm install
```

### Agent Portal

```bash
cd ../agent-portal

npm install
```

### Driver Portal

```bash
cd ../driver-portal

npm install
```

### Admin Portal

```bash
cd ../admin-portal

npm install
```

---

## Environment Variables

Create a `.env` file.

Backend

```env
PORT=5000

MONGO_URI=

JWT_SECRET=

FIREBASE_PROJECT_ID=

FIREBASE_API_KEY=

FIREBASE_AUTH_DOMAIN=
```

Frontend

```env
VITE_API_BASE_URL=

VITE_FIREBASE_API_KEY=

VITE_FIREBASE_AUTH_DOMAIN=

VITE_FIREBASE_PROJECT_ID=
```

---

# ▶ Running the Project

Backend

```bash
cd Backend

npm run dev
```

Traveler Portal

```bash
cd traveloop

npm run dev
```

Agent Portal

```bash
cd agent-portal

npm run dev
```

Driver Portal

```bash
cd driver-portal

npm run dev
```

Admin Portal

```bash
cd admin-portal

npm run dev
```

---

# 🎫 Smart Boarding Workflow

```text
Driver Opens Boarding

↓

Backend Updates Status

↓

Socket Event Broadcast

↓

Passenger Receives Access

↓

Generate QR Boarding Pass

↓

Driver Scans QR

↓

Passenger Verified

↓

Realtime Status Sync

↓

Agent Dashboard Updated
```

---

# 💬 Realtime Features

Traveloop V2 supports event-driven architecture.

Events include:

```text
boarding-opened

boarding-closed

passenger-boarded

driver-update-posted

message-sent

chat-typing

seat-assigned

booking-confirmed
```

---

# 🗄 Database Collections

```text
Users

Bookings

Trips

Payments

Drivers

Passengers

Messages

Notifications

Expenses

DriverUpdates

Itineraries
```

---

# 📁 Repository Structure

```bash
Traveloop-V2

Backend/

traveloop/

agent-portal/

driver-portal/

admin-portal/

docs/

public/

assets/

README.md
```

---

# 🔐 Security

Traveloop implements enterprise-grade security mechanisms.

Features include:

* JWT Authentication
* Role-Based Access Control
* Helmet Middleware
* CORS Protection
* NoSQL Injection Prevention
* XSS Protection
* Request Validation
* Rate Limiting
* Secure Environment Variables
* OWASP Best Practices

---

# ☁ Deployment

Frontend

* Vercel

Backend

* Render
* AWS ECS
* DigitalOcean

Database

* MongoDB Atlas

Realtime Services

* Firebase

---

# 📌 Future Roadmap

### Version 2.1

* AI Chatbot
* Voice Assistant
* Smart Suggestions
* Multi-language Support

### Version 2.5

* Dynamic Pricing
* Recommendation Engine
* ML Analytics
* Demand Forecasting

### Version 3.0

* AR Navigation
* Blockchain Tickets
* NFT Boarding Passes
* Virtual Tourism

---

# 🤝 Contribution

Contributions are welcome.

Create a branch:

```bash
git checkout -b feature/new-feature
```

Commit changes:

```bash
git commit -m "feat: added new feature"
```

Push changes:

```bash
git push origin feature/new-feature
```

Create a Pull Request.

---

# 📄 License

Distributed under the MIT License.

See the **LICENSE** file for more information.

---

# 👨‍💻 Author

## Sanjai R

 Full Stack Developer 

Building intelligent travel experiences through AI, realtime systems, and scalable cloud-native architectures.

---

# ⭐ Support

If you like this project:

⭐ Star the Repository

🍴 Fork the Repository

🚀 Contribute to the Platform

💙 Help Traveloop redefine intelligent tourism.
