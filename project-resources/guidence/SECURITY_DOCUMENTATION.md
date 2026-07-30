# Security Documentation — Traveloop V2

This document provides a breakdown of the security standards, credentials handlers, and middleware policies implemented in Traveloop V2.

---

## 1. Authentication & Session Strategy

### A. JSON Web Tokens (JWT)
* **Access Tokens**: Emitted during traveler register/login.
* **Storage**: Tokens are stored client-side in `localStorage` and sent in the request header as a Bearer token:
  `Authorization: Bearer <JWT_TOKEN>`
* **Secret Storage**: Decoupled entirely from code; stored under `JWT_SECRET` in local system `.env` configs.

### B. Firebase Integration (Realtime Chats)
* Anonymous Firebase authentication is bootstrapped dynamically using `signInAnonymously(auth)` to authenticate chat rooms read/writes.
* Firebase Firestore Security Rules restrict chat room message listings:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /trips/{tripId}/messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

---

## 2. API Protection & Rate Limiting

The Express.js gateway implements double-tier rate limiters via `express-rate-limit` in [server.js](file:///c:/Users/sanja/Trip-Planner-Hackathon/Backend/server.js):

1. **Global Requests Limiter**:
   * Restricts general API requests to **10,000 requests per 15 minutes** in development and **200 requests** in production.
2. **Authentication Gate Limiter**:
   * Restricts sensitive routes (`/api/auth/*`) to **20 attempts per 15 minutes** to prevent brute-force attacks.

---

## 3. Data Sanitization & OWASP Compliance

### A. NoSQL Injection Prevention
* User inputs are passed through Mongoose schemas which automatically cast and sanitize data types.
* Arbitrary Mongo queries containing operators like `$gt` or `$ne` are parsed and stripped.

### B. XSS & Security Headers
* **Helmet**: Integrates `helmet` middleware in Express to set safe HTTP headers (CSP, HSTS, Frame Options, Sniffing protection).
* **CORS Config**: Express CORS restricts origin calls to approved URLs only:
  ```javascript
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174"
  ];
  ```

---

## 4. Environment Variables Checklist

Ensure that the following variables are set and rotated periodically in production:

| Variable Name | Risk Category | Description |
| :--- | :--- | :--- |
| `JWT_SECRET` | Critical | Used to sign access tokens |
| `MONGO_URI` | Critical | Database access credentials |
| `GMAIL_REFRESH_TOKEN` | Medium | Mailing system OAuth credential |
| `VITE_FIREBASE_API_KEY`| Medium | Public client Firebase access key |
