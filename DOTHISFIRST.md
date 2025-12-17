# 🚀 RentVerse - Setup Guide

> **Do this first before running the application!**

This guide will help you set up the RentVerse backend and frontend for local development.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8+ | `npm install -g pnpm` |
| **PostgreSQL** | 14+ | [postgresql.org](https://www.postgresql.org/download/) |
| **PostGIS Extension** | - | Included with PostgreSQL installer |

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE rentverse;

# Enable PostGIS extension (required for geo-location features)
\c rentverse
CREATE EXTENSION IF NOT EXISTS postgis;

# Exit
\q
```

### 2. Note Your Database Credentials
You'll need these for the backend `.env` file:
- **Username**: `postgres` (or your custom user)
- **Password**: Your PostgreSQL password
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `rentverse`

---

## ⚙️ Backend Setup

### 1. Navigate to Backend Directory

```bash
cd rentverse-backend
```

### 2. Install Dependencies

```bash
pnpm install
```

> **Note**: If prompted to approve build scripts, select all Prisma packages and approve.

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update:

```env
# Database - REQUIRED
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rentverse?schema=public"

# JWT Secrets - REQUIRED (change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-session-secret-change-this

# SMTP Email (for OTP login) - REQUIRED
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=RentVerse <your_email@gmail.com>
```

> **Gmail App Password**: Enable 2FA on your Google account, then generate an app password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### 4. Generate Prisma Client

```bash
pnpm run db:generate
```

### 5. Push Database Schema

```bash
npx prisma db push
```

> Select "Yes" when prompted about data loss warnings.

### 6. Start the Backend Server

```bash
pnpm dev
```

**Backend is now running at:**
- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/docs
- Health Check: http://localhost:3000/health

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

Open a **new terminal** and run:

```bash
cd rentverse-frontend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and update:

```env
# Backend API (keep these as-is for local development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# AI Service (optional)
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000

# MapTiler (required for maps)
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key

# Cloudinary (required for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
NEXT_PUBLIC_CLOUDINARY_API_SECRET=your_api_secret
```

> **Get API Keys:**
> - MapTiler: [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/)
> - Cloudinary: [cloudinary.com/console](https://cloudinary.com/console)

### 4. Start the Frontend Server

```bash
pnpm dev
```

**Frontend is now running at:**
- Web UI: http://localhost:3001

---

## ✅ Verification

Once both servers are running:

1. Open http://localhost:3001 in your browser
2. Click "Log In" or "Sign Up"
3. If signup works and you receive an OTP email, everything is configured correctly!

---

## 🆘 Troubleshooting

### Backend Issues

| Error | Solution |
|-------|----------|
| `P1000` - Database auth failed | Check `DATABASE_URL` credentials in `.env` |
| `type "geometry" does not exist` | Run `CREATE EXTENSION postgis;` in your database |
| `EAUTH` - Missing credentials | Configure SMTP settings in `.env` |

### Frontend Issues

| Error | Solution |
|-------|----------|
| Port 3000 in use | Backend uses 3000, frontend auto-uses 3001 |
| API connection failed | Ensure backend is running first |

---

## 📁 Project Structure

```
uitm-devops-challenge-TopHacker/
├── rentverse-backend/     # Express.js API server
├── rentverse-frontend/    # Next.js web application
├── rentverse-ai-service/  # FastAPI ML service (optional)
├── rentverse-datasets/    # Scrapy data scraper (optional)
└── DOTHISFIRST.md         # This file
```

---

## 🎉 You're All Set!

Both services should now be running:

| Service | URL | Port |
|---------|-----|------|
| Backend API | http://localhost:3000 | 3000 |
| Frontend UI | http://localhost:3001 | 3001 |
| API Docs | http://localhost:3000/docs | 3000 |

Happy coding! 🏠
