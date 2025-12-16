# Backend Setup Guide (Beginner Friendly)

This guide will help you set up and run the **Rentverse Backend** step by step.

---

## Prerequisites

Before starting, make sure you have these installed:

| Requirement | Download Link |
|-------------|---------------|
| **Node.js** (v18+) | [https://nodejs.org](https://nodejs.org) |
| **PostgreSQL** | [https://postgresql.org/download](https://postgresql.org/download) |
| **pnpm** (recommended) | Run: `npm install -g pnpm` |

> **Tip:** To check if you have them installed:
> ```bash
> node -v      # Check Node.js version
> psql --version   # Check PostgreSQL version
> pnpm -v      # Check pnpm version
> ```

---

## Step 1: Navigate to the Backend Directory

Open your terminal and navigate to the backend folder:

```bash
cd rentverse-backend
```

---

## Step 2: Install Dependencies

Choose **one** of the following methods:

### Option A: Using pnpm (Recommended)
```bash
pnpm install
```

### Option B: Using npm
```bash
npm install
```

### Option C: Using Bun
```bash
bun install
```

---

## Step 3: Set Up Environment Variables

1. Copy the example environment file:

```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell) / Mac / Linux
cp .env.example .env
```

2. Open the `.env` file and update these important values:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/rentverse?schema=public"

# JWT Secret - Change this to a secure random string
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server Port
PORT=3000
```

---

## Step 4: Set Up the Database

### 4.1 Create the Database

Open PostgreSQL and create a new database:

```sql
CREATE DATABASE rentverse;
```

Or using command line:
```bash
psql -U postgres -c "CREATE DATABASE rentverse;"
```

### 4.2 Run Database Migrations

This creates all the required tables:

```bash
pnpm run db:migrate
```

Or with npm:
```bash
npm run db:migrate
```

### 4.3 Generate Prisma Client

```bash
pnpm run db:generate
```

### 4.4 (Optional) Seed the Database

Add sample data to the database:

```bash
pnpm run db:seed
```

---

## Step 5: Run the Development Server

Start the backend server:

### Using pnpm
```bash
pnpm dev
```

### Using npm
```bash
npm run dev
```

---

## Step 6: Verify It's Working

Once the server starts, you can:

1. **Open the API in browser:**
   ```
   http://localhost:3000
   ```

2. **View API Documentation (Swagger):**
   ```
   http://localhost:3000/api-docs
   ```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with auto-reload |
| `pnpm start` | Start production server |
| `pnpm run db:migrate` | Run database migrations |
| `pnpm run db:generate` | Generate Prisma client |
| `pnpm run db:studio` | Open Prisma Studio (database GUI) |
| `pnpm run db:seed` | Seed database with sample data |
| `pnpm run db:reset` | Reset database (WARNING: deletes all data) |
| `pnpm run lint` | Check code for errors |
| `pnpm run format` | Format code with Prettier |

---

## Project Structure (Quick Overview)

```
rentverse-backend/
├── src/               # Source code
│   ├── controllers/   # Request handlers
│   ├── routes/        # API routes
│   ├── middleware/    # Express middleware
│   ├── services/      # Business logic
│   └── utils/         # Helper functions
├── prisma/            # Database schema & migrations
│   ├── schema.prisma  # Database models
│   ├── migrations/    # Migration files
│   └── seed.js        # Seed data
├── templates/         # Email/PDF templates
├── uploads/           # Uploaded files
├── index.js           # Entry point
├── .env.example       # Environment template
└── package.json       # Dependencies
```

---

## Tech Stack

- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Swagger** - API documentation
- **Passport.js** - OAuth (Google, Facebook, etc.)
- **Cloudinary** - Image uploads
- **Multer** - File handling

---

## Environment Variables Explained

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: 3000) |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | Token expiration (default: 7d) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `S3_ENDPOINT` | Storage endpoint for uploads |

---

## Troubleshooting

### "Cannot connect to database"
- Make sure PostgreSQL is running
- Check your `DATABASE_URL` credentials
- Verify the database exists

### "Port 3000 already in use"
- Change the `PORT` in your `.env` file
- Or stop the other application using port 3000

### "Prisma client not generated"
```bash
pnpm run db:generate
```

### "Migration failed"
- Check your database connection
- Make sure PostgreSQL is running
- Try resetting: `pnpm run db:reset` (WARNING: deletes data)

### Dependencies failed to install
```bash
rm -rf node_modules
pnpm install
```

---

## Useful Tools

### Prisma Studio
View and edit your database with a visual interface:
```bash
pnpm run db:studio
```
Opens at: `http://localhost:5555`

### Swagger API Docs
Interactive API documentation:
```
http://localhost:3000/api-docs
```

---

## Need Help?

- Check the main [README.md](./README.md) for more details
- View API documentation at `/api-docs` when server is running

---

Happy coding!
