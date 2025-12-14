# Rentverse Backend

Express.js backend template with Prisma, PostgreSQL, Swagger UI, and Husky pre-commit hooks.

## Features

- ✅ Express.js server with organized folder structure
- ✅ Prisma ORM with PostgreSQL
- ✅ Swagger UI documentation at `/docs`
- ✅ Authentication & Authorization with JWT
- ✅ CORS, Helmet, Morgan middleware
- ✅ Husky pre-commit hooks
- ✅ Prettier & ESLint for code formatting
- ✅ Environment variables support
- ✅ Error handling middleware
- ✅ Database seeding
- ✅ Health check endpoint

## Project Structure

```
rentverse-backend/
├── index.js                    # Application entry point
├── package.json               # Dependencies and scripts
├── prisma/                    # Prisma schema and migrations
│   ├── schema.prisma          # Database schema
│   └── seed.js               # Database seeding
├── src/                      # Main source code
│   ├── app.js                # Express app configuration
│   ├── config/               # Application configuration
│   │   ├── database.js       # Database connection
│   │   └── swagger.js        # Swagger configuration
│   ├── middleware/           # Custom middleware
│   │   └── auth.js          # Authentication middleware
│   └── routes/              # API routes
│       ├── auth.js          # Authentication endpoints
│       ├── users.js         # User management endpoints
│       ├── properties.js    # Property management endpoints
│       └── bookings.js      # Booking management endpoints
├── .husky/                  # Git hooks
├── .env.example            # Environment variables template
├── .prettierrc             # Prettier configuration
├── .eslintrc.json          # ESLint configuration
└── README.md              # Project documentation
```

## Installation

1. **Clone repository and install dependencies:**

```bash
cd rentverse-backend
pnpm install
```

2. **Setup environment variables:**

```bash
cp .env.example .env
# Edit .env with your database configuration and JWT secret
```

3. **Setup PostgreSQL database:**
   - Make sure PostgreSQL is installed and running
   - Create a new database for the project
   - Update `DATABASE_URL` in `.env` file

4. **Generate Prisma client and run migrations:**

```bash
pnpm db:generate
pnpm db:migrate
```

5. **Seed database with sample data:**

```bash
pnpm db:seed
```

6. **Start the server:**

```bash
# Development mode
pnpm dev

# Production mode
pnpm start
```

## Environment Variables

Create `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rentverse?schema=public"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API
API_VERSION=v1
```

## API Endpoints

Server will run at `http://localhost:3000`

### API Documentation

- **Swagger UI**: `http://localhost:3000/docs`

### General Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### User Endpoints

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Property Endpoints

- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get property by ID
- `GET /api/properties/geojson` - **🗺️ Get properties in GeoJSON format for maps**
- `POST /api/properties` - Create new property (Landlord/Admin)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

#### 🗺️ GeoJSON Map Endpoint

**High-performance endpoint for map integration:**

```bash
GET /api/properties/geojson?bbox=minLng,minLat,maxLng,maxLat[&limit=1000][&clng=][&clat=][&q=]
```

**Parameters:**

- `bbox` (required): Bounding box "minLng,minLat,maxLng,maxLat"
- `limit` (optional): Max properties (1-1000, default: 1000)
- `clng,clat` (optional): Center coordinates for distance sorting
- `q` (optional): Search query

**Example:**

```bash
curl "http://localhost:3000/api/properties/geojson?bbox=106.7,-6.3,106.9,-6.1&limit=100"
```

**Features:**

- ⚡ Raw SQL queries for maximum performance
- 🎯 PostGIS geometry support for spatial queries
- 📍 Distance-based sorting from center point
- 🔍 Full-text search on title/city/address
- 🎨 GeoJSON format ready for Leaflet/Mapbox
- 💰 Pre-formatted price display
- 🖼️ Thumbnail image included

### Booking Endpoints

- `GET /api/bookings` - Get bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

## Database Schema

This project uses three main models:

### User

- Stores user information (tenant, landlord, admin)
- Authentication and role-based access control

### Property

- Stores rental property information
- Relationship with User (owner)

### Booking

- Stores booking information
- Relationship with User and Property

## Scripts

- `pnpm start` - Run production server
- `pnpm dev` - Run development server with nodemon
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:reset` - Reset database and re-run migrations
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues

## Authentication

API uses JWT for authentication. After login, use the token in headers:

```
Authorization: Bearer <your-jwt-token>
```

### Demo Credentials

After running `pnpm db:seed`, you can login with:

- **Admin**: `admin@rentverse.com` / `password123`
- **Landlord**: `landlord@rentverse.com` / `password123`
- **Tenant**: `tenant@rentverse.com` / `password123`

## Development Tools

### Code Quality

- **Prettier**: Code formatting
- **ESLint**: Code linting
- **Husky**: Git hooks for pre-commit checks

### Database

- **Prisma**: Modern ORM with type safety
- **PostgreSQL**: Robust relational database

### API Documentation

- **Swagger UI**: Interactive API documentation
- **JSDoc**: Code documentation in route files

## Deployment

To deploy to production:

1. Set appropriate environment variables
2. Run database migrations: `pnpm db:deploy`
3. Start application: `pnpm start`

## Contributing

1. Ensure code is formatted with Prettier: `pnpm format`
2. Ensure no ESLint errors: `pnpm lint`
3. Test API endpoints using Swagger UI
4. Commits will automatically run pre-commit hooks

##
