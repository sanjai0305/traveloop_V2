# API Documentation — Traveloop V2

This document provides a comprehensive log of the REST API endpoints exposed by the Traveloop V2 Backend server.

---

## Base URL
* Local Development: `http://localhost:5000/api`
* Production: `https://api.traveloop.v2`

---

## 1. Authentication Layer

### POST `/auth/register`
Creates a new Traveler account.
* **Request Body**:
  ```json
  {
    "firstName": "Sanjai",
    "lastName": "M",
    "email": "traveler@example.com",
    "password": "Password123!",
    "phone": "9876543210",
    "city": "Salem",
    "country": "India"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN",
    "user": { "id": "USER_ID", "email": "traveler@example.com" }
  }
  ```

### POST `/auth/login`
Authenticates traveler credentials.
* **Request Body**:
  ```json
  {
    "email": "traveler@example.com",
    "password": "Password123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN",
    "user": { "id": "USER_ID", "email": "traveler@example.com" }
  }
  ```

---

## 2. Bookings & Payments

### POST `/bookings/create`
Creates a trip booking for a traveler.
* **Request Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "tripId": "AGENT_TRIP_ID",
    "seats": 2,
    "travelerName": "Sanjai M",
    "gender": "Male",
    "age": 24,
    "phone": "9876543210",
    "pickupLocation": "Five Roads"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "booking": {
      "bookingId": "BKG-1719782500",
      "seats": 2,
      "pricePaid": 7998,
      "paymentStatus": "Paid"
    }
  }
  ```

---

## 3. Driver & Boarding Operations

### POST `/driver/trips/:tripId/open-boarding`
Opens the boarding window for an assigned trip. Enables pass generation for travelers.
* **Request Headers**: `Authorization: Bearer <DRIVER_TOKEN>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "boardingStatus": "OPEN",
    "openedAt": "2026-06-30T16:00:00.000Z",
    "closedAt": "2026-06-30T17:45:00.000Z"
  }
  ```

### POST `/driver/trips/:tripId/close-boarding`
Closes the boarding window, deactivating QR pass generation.
* **Request Headers**: `Authorization: Bearer <DRIVER_TOKEN>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "boardingStatus": "CLOSED"
  }
  ```

---

## 4. Driver Updates (Announcements)

### GET `/driver-updates/:tripId`
Fetches all live updates/announcements posted by the driver for a trip.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "updates": [
      {
        "_id": "UPDATE_ID",
        "type": "delay",
        "message": "Delayed by 15 mins due to traffic.",
        "driverName": "Sanjai",
        "createdAt": "2026-06-30T16:05:00.000Z"
      }
    ]
  }
  ```

### POST `/driver-updates/:tripId`
Posts a new driver alert or update. Emits a WebSocket notify event.
* **Request Headers**: `Authorization: Bearer <DRIVER_TOKEN>`
* **Request Body**:
  ```json
  {
    "type": "alert",
    "message": "Please report at Platform 3 for boarding."
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "update": { "_id": "UPDATE_ID", "type": "alert", "message": "..." }
  }
  ```

---

## 5. Trip Members

### GET `/trip-members/:agentTripId`
Returns confirmed traveler passengers and driver assigned details for roster views.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "members": [
      {
        "name": "Sanjai Passenger",
        "gender": "Male",
        "age": 24,
        "assignedSeat": "12",
        "boardingStatus": "Checked-In",
        "status": "confirmed",
        "joinedAt": "2026-06-30T15:00:00.000Z"
      }
    ],
    "driver": {
      "name": "Vision Driver",
      "phone": "9876543210",
      "photo": "http://...",
      "status": "active"
    }
  }
  ```
