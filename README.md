# 🚀 Running Traveloop V2

## Prerequisites

- Docker Desktop (Latest)
- Docker Compose v2+

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/traveloop_v2.git
cd traveloop_V2
```

---

## 2. Start the Application

Build and start all services:

```bash
docker compose up --build -d
```

---

## 3. Verify Running Containers

```bash
docker compose ps
```

---

## 4. Access the Applications

| Service | URL |
|---------|-----|
| User Website | http://localhost:3000 |
| Admin Portal | http://localhost:3001 |
| Agent Portal | http://localhost:3002 |
| Driver Portal | http://localhost:3003 |
| Backend API | http://localhost:5000 |
| AI Service | http://localhost:8000 |
| Qdrant Dashboard | http://localhost:6333 |

---

## 5. View Logs (Optional)

```bash
docker compose logs -f
```

View a specific service:

```bash
docker compose logs -f backend
```

---

## 6. Stop the Application

```bash
docker compose down
```

Remove containers, networks, and volumes:

```bash
docker compose down -v
```

---

# 💻 Local Development

## Backend

```bash
cd Backend
npm install
npm run dev
```

---

## AI Service

```bash
cd ai-service

python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

---

## User Website

```bash
cd user-website
npm install
npm run dev
```

---

## Admin Portal

```bash
cd admin-portal
npm install
npm run dev
```

---

## Agent Portal

```bash
cd agent-portal
npm install
npm run dev
```

---

## Driver Portal

```bash
cd driver-portal
npm install
npm run dev
```

---

## Default Local URLs

| Service | URL |
|---------|-----|
| User Website | http://localhost:3000 |
| Admin Portal | http://localhost:3001 |
| Agent Portal | http://localhost:3002 |
| Driver Portal | http://localhost:3003 |
| Backend API | http://localhost:5000 |
| AI Service | http://localhost:8000 |