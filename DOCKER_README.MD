---

# 🐳 Docker Setup — Recommended

Traveloop V2 supports Docker Compose, allowing the complete ecosystem to run with a single command.

Docker automatically manages the required application dependencies and starts:

- Traveler Application
- Public Website
- Admin Portal
- Agent Portal
- Driver Portal
- Backend API
- MongoDB
- Redis

This is the recommended method when running the complete Traveloop V2 ecosystem.

## Prerequisite

Install and start Docker Desktop (Windows/macOS) or Docker Engine with Docker Compose (Linux).

Verify Docker:

```powershell
docker --version
docker compose version
```

---

## 🚀 First-Time Docker Setup

Clone the repository:

```powershell
git clone https://github.com/sanjai0305/traveloop_V2.git

cd traveloop_V2
```

Build all Docker images and start all services:

```powershell
docker compose up -d --build
```

The first build may take several minutes because Docker needs to download base images and install application dependencies.

Once completed, verify the containers:

```powershell
docker compose ps
```

All required containers should show `Up`, `Running`, or `Healthy`.

---

## 🌐 Docker Local URLs

When running through Docker Compose, use the following URLs:

| Service | URL |
|---|---|
| Admin Portal | `http://localhost:3001` |
| Agent Portal | `http://localhost:3002` |
| Driver Portal | `http://localhost:3003` |
| Traveler Application | `http://localhost:3004` |
| Public Website | `http://localhost:3005` |
| Backend API | `http://localhost:5000` |
| MongoDB | `localhost:27017` |
| Redis | `localhost:6379` |

> Docker ports differ from the manual Vite development ports documented below.

---

## ▶️ Start Traveloop

If the Docker images have already been built:

```powershell
docker compose up -d
```

There is no need to manually run `npm install`, `npm run dev`, or `node server.js` for each service when using Docker.

---

## ⏹️ Stop Traveloop

Stop and remove the running containers:

```powershell
docker compose down
```

To start them again:

```powershell
docker compose up -d
```

---

## 🔄 After Pulling New Code

Pull the latest changes:

```powershell
git pull origin main
```

If application source code or dependencies have changed, rebuild and restart:

```powershell
docker compose up -d --build
```

This rebuilds the required images and starts the updated containers.

---

## 📊 Check Container Status

```powershell
docker compose ps
```

View logs from all services:

```powershell
docker compose logs -f
```

View logs for a specific service:

```powershell
docker compose logs -f backend
```

Example:

```powershell
docker compose logs -f user-application
```

---

## 🖼️ Check Docker Images

```powershell
docker images
```

Traveloop Docker Compose builds images for:

```text
traveloop_v2-backend
traveloop_v2-user-application
traveloop_v2-user-website
traveloop_v2-admin-portal
traveloop_v2-agent-portal
traveloop_v2-driver-portal
```

MongoDB and Redis use their official Docker images.

---

## ⚡ Docker Quick Start

For a new machine:

```powershell
git clone https://github.com/sanjai0305/traveloop_V2.git
cd traveloop_V2
docker compose up -d --build
```

For an existing clone:

```powershell
git pull origin main
docker compose up -d --build
```

For normal daily startup when no code has changed:

```powershell
docker compose up -d
```

---

# 🛠️ Manual Development Setup

If Docker is not being used, Traveloop V2 can also be run manually using Node.js and npm.

Follow the manual setup instructions below.