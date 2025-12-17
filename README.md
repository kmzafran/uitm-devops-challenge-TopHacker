# 🏠 RentVerse - DevSecOps Challenge Submission

[![Security](https://img.shields.io/badge/Security-5%20Modules-success)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-blueviolet)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)](https://www.postgresql.org/)

**UiTM DevSecOps Challenge - Property Rental Platform with Comprehensive Security Implementation**

---

## 📋 Project Overview

RentVerse is a full-stack property rental platform that implements **5 core security modules** as part of the UiTM DevSecOps Challenge. This submission demonstrates enterprise-grade security practices following OWASP guidelines and DevSecOps best practices.

### 🎯 Challenge Modules Implemented

| Module | Description | Status |
|--------|-------------|--------|
| **1. Secure Login & MFA** | Multi-factor authentication with OTP | ✅ Complete |
| **2. Secure API Gateway** | Rate limiting, JWT, HTTPS ready | ✅ Complete |
| **3. Digital Agreement** | E-signatures with audit trail | ✅ Complete |
| **4. Smart Notifications** | Real-time security alerts | ✅ Complete |
| **5. Activity Log Dashboard** | Admin monitoring dashboard | ✅ Complete |
| **6. CI/CD Security Testing** | GitHub Actions workflows | 🎁 Bonus |

---

## 🛡️ Security Highlights

### 🔐 Authentication & Authorization
- ✅ **MFA with Email OTP** - Two-factor authentication
- ✅ **JWT Tokens** - Secure session management
- ✅ **OAuth 2.0** - Google, Facebook, GitHub, Twitter, Apple
- ✅ **Role-Based Access** - USER and ADMIN roles
- ✅ **Account Lockout** - Brute-force protection

### 🚨 Threat Detection & Monitoring
- ✅ **Risk Scoring** - Login attempts rated 0-100
- ✅ **Device Fingerprinting** - Track known/unknown devices
- ✅ **Suspicious Activity Alerts** - Real-time email notifications
- ✅ **IP Tracking** - Geolocation and pattern analysis
- ✅ **Login History** - Comprehensive audit trails

### 📊 Admin Security Dashboard
- ✅ **Real-time Statistics** - Login metrics, failure rates
- ✅ **User Risk Assessment** - Flag high-risk accounts
- ✅ **Security Alerts** - View all system alerts
- ✅ **7-Day Trends** - Visual analytics
- ✅ **Login History** - Detailed activity logs

### 🔏 Digital Agreement Security
- ✅ **Dual-Party Signatures** - Landlord & tenant
- ✅ **SHA-256 Hashing** - Document integrity verification
- ✅ **Audit Logs** - All actions tracked
- ✅ **Version Control** - Document history
- ✅ **IP & Timestamp** - Signature metadata

### ⚡ API Security
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Helmet.js** - Security headers
- ✅ **CORS Protection** - Configured origins
- ✅ **XSS Protection** - Input sanitization
- ✅ **SQL Injection Prevention** - Prisma ORM

---

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **Authentication**: JWT, Passport.js
- **Security**: Helmet, express-rate-limit, bcrypt
- **Email**: Nodemailer
- **PDF**: Puppeteer
- **Storage**: Cloudinary / S3-compatible

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context API
- **API Client**: Axios

---

## 📂 Repository Structure

```
rentverse/
├── rentverse-backend/          # Backend API
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── middleware/        # Auth, rate limiting, logging
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   └── modules/           # Feature modules
│   ├── prisma/                # Database schema & migrations
│   ├── logs/                  # Security & access logs
│   └── .env.example           # Environment template
│
├── rentverse-frontend/         # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Next.js pages
│   │   ├── utils/             # Utilities
│   │   └── context/           # State management
│   └── public/                # Static assets
│
└── SECURITY_MODULES_TESTING.md  # Testing documentation
```

---

## ⚙️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended)

### Backend Setup

```bash
cd rentverse-backend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
pnpm run db:migrate
pnpm run db:generate

# Start development server
pnpm dev
```

Backend runs on: `http://localhost:8000`

### Frontend Setup

```bash
cd rentverse-frontend

# Install dependencies
pnpm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with backend URL

# Start development server
pnpm dev
```

Frontend runs on: `http://localhost:3000`

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # Login (triggers MFA)
POST   /api/auth/mfa/verify     # Verify OTP
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Get current user
```

### Admin Security Dashboard
```
GET    /api/admin/security/statistics      # Dashboard metrics
GET    /api/admin/security/login-history   # Login logs
GET    /api/admin/security/alerts          # Security alerts
GET    /api/admin/security/users-at-risk   # High-risk users
```

### Digital Agreements
```
GET    /api/agreements/:id                 # Get agreement
POST   /api/agreements/:id/sign            # Sign agreement
GET    /api/agreements/:id/verify          # Verify integrity
```

**Full API Documentation**: `http://localhost:8000/docs` (Swagger UI)

---

## 🧪 Testing Documentation

Comprehensive testing documentation is available in:
- [`SECURITY_MODULES_TESTING.md`](./SECURITY_MODULES_TESTING.md) - Detailed test results for all modules

### Test Coverage

| Module | Tested | Status |
|--------|--------|--------|
| Secure Login & MFA | ✅ | PASS |
| Secure API Gateway | ✅ | PASS |
| Digital Agreement | ✅ | PASS |
| Smart Notifications | ✅ | PASS |
| Activity Log Dashboard | ✅ | PASS |

---

## 🎯 Module Implementation Details

### Module 1: Secure Login & MFA (OWASP M1-M3)

**Implemented Features:**
- Email/password registration with validation
- Multi-factor authentication via OTP
- OAuth 2.0 integration (5 providers)
- JWT token-based sessions
- Account lockout after 5 failed attempts
- Password hashing (bcrypt, 12 rounds)

**Security Measures:**
- MFA enabled by default for all users
- OTP expiration (5 minutes)
- Maximum 3 OTP verification attempts
- Token blacklisting on logout
- Session timeout configuration

**Files:**
- `src/routes/auth.js`
- `src/services/otp.service.js`
- `src/middleware/auth.js`

---

### Module 2: Secure API Gateway (OWASP M5-M6)

**Implemented Features:**
- Rate limiting per endpoint
- HTTPS/TLS ready configuration
- Security headers (Helmet.js)
- CORS protection
- Request validation
- JWT verification middleware

**Rate Limits:**
| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 req/15min |
| Auth endpoints | 5 req/5min |
| OTP verification | 3 req/min |

**Files:**
- `src/middleware/rateLimit.js`
- `src/middleware/auth.js`
- `src/app.js` (Helmet config)

---

### Module 3: Digital Agreement

**Implemented Features:**
- Canvas-based digital signatures
- Dual-party signing workflow
- SHA-256 document hashing
- Signature validation
- Audit trail logging
- Document versioning
- IP address tracking

**Database Schema:**
```prisma
model RentalAgreement {
  landlordSigned     Boolean
  landlordSignature  String?  // Base64 canvas
  landlordSignHash   String?  // SHA-256
  landlordIpAddress  String?
  tenantSigned       Boolean
  tenantSignature    String?
  tenantSignHash     String?
  documentHash       String?  // Integrity check
}
```

**Files:**
- `src/routes/agreement.routes.js`
- `src/services/digitalAgreement.service.js`
- `src/services/eSignature.service.js`

---

### Module 4: Smart Notification & Alert System

**Implemented Features:**
- Real-time security alerts
- Email notifications
- Suspicious activity detection
- Device fingerprinting
- Risk score calculation (0-100)
- Login pattern analysis

**Alert Types:**
| Alert | Trigger |
|-------|---------|
| NEW_DEVICE | Unknown device login |
| MULTIPLE_FAILURES | 3+ failed attempts |
| ACCOUNT_LOCKED | Account locked |
| PASSWORD_CHANGED | Password reset |
| SUSPICIOUS_TIMING | Unusual login time |
| NEW_LOCATION | Different location |

**Files:**
- `src/services/securityAlert.service.js`
- `src/services/suspiciousActivity.service.js`
- `src/services/email.service.js`

---

### Module 5: Activity Log Dashboard

**Implemented Features:**
- Admin security dashboard
- Login history tracking
- Security metrics
- Risk assessment
- File-based logging
- Real-time statistics

**Dashboard Metrics:**
- Total logins (24h, 7d)
- Failed login rate
- High-risk logins
- Alert counts
- Locked accounts
- OAuth vs Email breakdown

**Admin Endpoints:**
```
GET /api/admin/security/statistics       # Dashboard
GET /api/admin/security/login-history    # Logs  
GET /api/admin/security/alerts           # Alerts
GET /api/admin/security/users-at-risk    # Risk
```

**Files:**
- `src/routes/admin.security.routes.js`
- `src/middleware/apiLogger.js`
- `logs/security.log`

---

## 🔐 Security Best Practices Implemented

### OWASP Mobile Top 10
- ✅ **M1**: Improper Platform Usage - MFA implementation
- ✅ **M2**: Insecure Data Storage - Encrypted credentials
- ✅ **M3**: Insecure Communication - HTTPS ready
- ✅ **M5**: Insufficient Cryptography - Strong hashing
- ✅ **M6**: Insecure Authorization - JWT + RBAC

### Additional Security Measures
- ✅ **Input Validation** - express-validator
- ✅ **SQL Injection Prevention** - Prisma ORM
- ✅ **XSS Protection** - Input sanitization
- ✅ **CSRF Protection** - Token-based auth
- ✅ **Session Security** - JWT expiration
- ✅ **Audit Logging** - Comprehensive trails

---

## 📊 Database Schema

**Key Models:**
- `User` - Authentication & profile
- `OtpCode` - MFA codes
- `LoginHistory` - Login tracking
- `UserDevice` - Device fingerprints
- `SecurityAlert` - Alert records
- `RentalAgreement` - Digital agreements
- `AgreementAuditLog` - Audit trail

**Full schema**: `rentverse-backend/prisma/schema.prisma`

---

## 🚀 Deployment

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-secret-key"
SMTP_HOST="smtp.gmail.com"
FRONTEND_URL="https://your-domain.com"
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secret (32+ chars)
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure SMTP for emails
- [ ] Set secure CORS origins
- [ ] Enable PostgreSQL SSL
- [ ] Run migrations: `pnpm run db:deploy`
- [ ] Use PM2 for process management

---

## 🤝 Team

- **Developed by**: Zafran Ishak (kmzafran@gmail.com)  
                  Ezril Besry (kudanish45@gmail.com)
                  Daniel Rosli (dhakim641@gmail.com)
- **Institution**: Universiti Teknologi MARA (UiTM)  
- **Challenge**: DevSecOps Security Implementation  

---

## 📄 License

ISC License

---

## 🙏 Acknowledgments

- UiTM DevSecOps Challenge Team
- OWASP Security Guidelines
- Express.js & Prisma Communities
- Open Source Security Tools
- Amir Hafizi (Senior Developer)

---

## 📞 Support

For questions or issues:
- **Email**: kmzafran@gmail.com
- **GitHub Issues**: [Open an issue](https://github.com/yourusername/rentverse/issues)

---

**⭐ Star this repository if you find it useful!**

---

**Last Updated**: December 17, 2025
