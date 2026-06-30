# System Architecture — Traveloop V2

This document provides a detailed breakdown of the Traveloop V2 architecture, including system flows, module specifications, and technology topologies.

---

## 1. Architectural Overview

Traveloop V2 is built on a **Modular Micro-Frontend and Unified API Gateway** model, designed to support real-time data sync across travelers, drivers, agencies, and system admins.

```mermaid
graph TD
  subgraph Client Portals
    Traveler[Traveler App - Mobile First]
    Agent[Agent Portal - Web Panel]
    Driver[Driver Portal - Mobile Web]
    Admin[Admin Panel - Desktop Web]
  end

  subgraph API & Realtime Gateway
    Server[Backend Server - Express.js]
    Socket[WebSockets - Socket.io]
    FirebaseRT[Firebase Realtime Database]
  end

  subgraph Databases & Storage
    Mongo[(MongoDB - Mongoose)]
    Firestore[(Cloud Firestore)]
    Storage[(Firebase Cloud Storage)]
  end

  subgraph External Integration
    Weather[Open-Meteo API]
    Maps[Google Maps API]
    SMS[SMTP / Mail Gateway]
  end

  %% Relationships
  Traveler --> Server
  Traveler --> Socket
  Traveler --> FirebaseRT
  Agent --> Server
  Driver --> Server
  Driver --> Socket
  Admin --> Server

  Server --> Mongo
  Server --> Firestore
  Server --> Storage

  Server --> Weather
  Server --> Maps
  Server --> SMS
```

---

## 2. Component Explanations

### A. Client Portals (Micro-Frontends)
1. **Traveler Portal (`traveloop`)**: Mobile-first Web/PWA interface built using React, React Router, and TailwindCSS. Manages client-side state, packing lists, expense sheets, private journals, and displays live boarding QR passes.
2. **Agent Portal (`agent-portal`)**: Desktop web dashboard for package listings, calendar management, and passenger roster detail sheets.
3. **Driver Portal (`driver-portal`)**: Real-time interface for dispatch operations, allowing driver check-ins, boarding window switches (Open/Close Boarding), and QR scanning logic.
4. **Admin Portal (`admin-portal`)**: System setting configuration and system analytics monitoring.

### B. Communication & State Synchronization Layer
* **REST API**: Serves JSON payloads for transactional actions (Register, Login, Booking, Payment).
* **Socket.io (WebSockets)**: Handles event-driven updates. Emmits events such as `boarding-opened`, `passenger_boarded`, and `driver-update-posted` for zero-refresh UI updates.
* **Firebase SDK (Firestore & Realtime Database)**: Backs real-time features like the package group chats, user presence, and typing status indicators.

---

## 3. Realtime Boarding Event Sequence

This diagram details the sequence of a passenger boarding verification flow from the driver portal through the system databases to the traveler app:

```mermaid
sequenceDiagram
  autonumber
  passenger->>Traveler App: Click "Generate Boarding Pass"
  Traveler App->>Backend: Request QR Token (checks if boarding is OPEN)
  Backend-->>Traveler App: Return signed QR Token
  Traveler App->>Traveler App: Render QRCode SVG
  driver->>Driver Portal: Scan passenger's QR Code
  Driver Portal->>Backend: POST /api/scanner/verify (Token)
  Backend->>MongoDB: Find Booking & mark boardingStatus = "Boarded"
  MongoDB-->>Backend: OK
  Backend->>Socket.io: Emit "passenger_boarded" (bookingId)
  Socket.io-->>Traveler App: Trigger live reload -> Display checked-in badge!
  Backend-->>Driver Portal: Return Passenger Verified (Green Screen)
```

---

## 4. Deployment Topology

The production architecture separates stateless servers from storage clusters to optimize scalability:

* **Frontend Portals**: Managed and served globally via Vercel Edge networks.
* **Backend API Server**: Node.js app instance hosted on AWS ECS / Render with PM2 process monitors.
* **MongoDB**: Multi-region MongoDB Atlas cluster.
* **Realtime Services**: Google Firebase Firestore and Realtime Database cloud nodes.
