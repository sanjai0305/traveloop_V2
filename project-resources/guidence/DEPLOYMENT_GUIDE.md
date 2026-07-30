# Deployment Guide — Traveloop V2

This guide outlines deployment procedures for staging and production environments of Traveloop V2.

---

## 1. Prerequisites Checklist
* Active **MongoDB Atlas** account.
* Active **Firebase Console** project.
* Active **Vercel** account (for frontend hosting).
* Deploy target for Node.js API (e.g. AWS ECS, Heroku, or DigitalOcean droplet).

---

## 2. MongoDB Atlas Configuration
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a new Cluster (M0 Free Tier or higher).
3. Under **Database Access**, create a user with read/write credentials.
4. Under **Network Access**, whitelist your deployment IPs (or add `0.0.0.0/0` if deploying to serverless platforms).
5. Retrieve the Connection URI string:
   `mongodb+srv://<user>:<password>@cluster.mongodb.net/traveloop_v2`

---

## 3. Firebase Console Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Add a new project: `traveloop-v2`.
3. In the project settings, register a new Web App to retrieve the configuration JSON block:
   ```json
   {
     "apiKey": "YOUR_FIREBASE_API_KEY",
     "authDomain": "YOUR_FIREBASE_AUTH_DOMAIN",
     "projectId": "YOUR_FIREBASE_PROJECT_ID",
     "storageBucket": "YOUR_FIREBASE_STORAGE_BUCKET",
     "messagingSenderId": "YOUR_FIREBASE_MESSAGING_SENDER_ID",
     "appId": "YOUR_FIREBASE_APP_ID"
   }
   ```
4. Enable **Firestore Database** and set default security rules.
5. Enable **Realtime Database** (used for chat presence and typing status).
6. Under **Authentication**, enable **Anonymous Auth** provider.

---

## 4. Backend Deployment Example
1. Link your GitHub repository to your Node.js hosting provider.
2. Create a new **Web Service / App**.
3. Set the build parameters:
   * Root Directory: `Backend`
   * Build Command: `npm install`
   * Start Command: `node server.js`
4. Inject Environment variables:
   * `MONGODB_URI`
   * `DATABASE_NAME`
   * `JWT_SECRET`
   * `FIREBASE_PROJECT_ID`
   * `FIREBASE_CLIENT_EMAIL`
   * `FIREBASE_PRIVATE_KEY`

---

## 5. Frontends Deployment (Vercel)
Each micro-frontend can be deployed as an independent Vercel project:

1. Import the root repository to [Vercel](https://vercel.com/).
2. For the **Traveler App**:
   * Root Directory: `traveloop`
   * Framework Preset: `Vite`
   * Environment Variable: Set `VITE_API_BASE_URL` to your Backend URL (e.g. `https://api.traveloop.com/api`).
3. For the **Agent Portal**:
   * Root Directory: `agent-portal`
   * Framework Preset: `Vite`
   * Environment Variable: Set `VITE_API_BASE_URL`.
4. For the **Driver Portal**:
   * Root Directory: `driver-portal`
   * Framework Preset: `Vite`
   * Environment Variable: Set `VITE_API_BASE_URL`.
