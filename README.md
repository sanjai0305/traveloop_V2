# Traveloop V2 🚀

An AI-powered travel planning and booking platform designed to connect Travelers, Agents, and Drivers in a real-time, unified ecosystem.

---

## 🏗️ Architecture & Modules

Traveloop V2 is built as a multi-portal ecosystem comprising:

1. **Traveler Portal (`traveloop`)**: The traveler-facing mobile-first React application. Features AI-generated itineraries, multi-budget tracking, checklists, group chats, live weather updates, and a digital boarding pass system.
2. **Agent Portal (`agent-portal`)**: A comprehensive management dashboard for travel agencies. Features trip creation, pricing structures, seat layouts, booking registries, and passenger roster details.
3. **Driver Portal (`driver-portal`)**: A tailored view for bus and trip drivers to see assigned trips, open/close boarding windows, post live travel updates (pickup timing, delays, alerts), and scan traveler boarding QR codes.
4. **Admin Portal (`admin-portal`)**: A central management panel for system-wide configurations, commissions, and stats.
5. **Backend Server (`Backend`)**: An Express.js + Mongoose REST API and Socket.io server facilitating real-time updates and synchronization.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite, TailwindCSS, Framer Motion, Lucide Icons)
* **Backend**: Node.js, Express.js, Socket.io
* **Database**: MongoDB (Mongoose), Firebase (Firestore for chat/presence)
* **API Utilities**: Open-Meteo API (Weather), Geocoding API

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB (Local or Atlas)
* Firebase Project Credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sanjai0305/traveloop_V2.git
   cd traveloop_V2
   ```

2. Install dependencies for each module:
   ```bash
   # Backend
   cd Backend && npm install
   
   # Traveler App
   cd ../traveloop && npm install
   
   # Agent Portal
   cd ../agent-portal && npm install
   
   # Driver Portal
   cd ../driver-portal && npm install
   
   # Admin Portal
   cd ../admin-portal && npm install
   ```

3. Setup environment variables by copying `.env.example` file templates.

4. Start development servers:
   ```bash
   # Start Backend
   cd Backend && npm run dev
   
   # Start portals in their respective directories
   npm run dev
   ```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
