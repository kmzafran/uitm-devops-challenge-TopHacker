# Rentverse Frontend

> **A comprehensive rental property platform that connects property owners with tenants through an intuitive, modern web
application.**

Rentverse is a full-featured property rental platform built with cutting-edge web technologies. It provides a seamless
experience for property discovery, management, and rental transactions. The platform caters to both property owners
looking to list their rentals and tenants searching for their perfect home.

## 🎯 Project Overview

### What is Rentverse?

Rentverse is a modern rental marketplace that simplifies the property rental process. The platform offers:

- **For Tenants**: Advanced property search, filtering, wishlist management, and seamless rental applications
- **For Property Owners**: Easy property listing creation, management tools, and tenant communication
- **For Administrators**: Comprehensive dashboard for platform oversight and user management

The application features a responsive design that works flawlessly across desktop, tablet, and mobile devices, ensuring
users can access their rental needs anywhere, anytime.

### Key Problem We Solve

Traditional property rental processes are often fragmented, time-consuming, and lack transparency. Rentverse addresses
these challenges by:

1. **Centralizing Property Discovery**: All available rentals in one searchable platform
2. **Streamlining the Rental Process**: From search to application submission
3. **Providing Transparency**: Clear pricing, detailed property information, and ratings
4. **Enabling Efficient Management**: Tools for property owners to manage listings and applications

## 🚀 Core Features

### 🔍 **Advanced Property Search & Discovery**

- **Smart Filtering**: Filter by location, property type, price range, and rental duration
- **Interactive Map Integration**: MapTiler-powered maps for location visualization
- **Real-time Search**: Instant results as you type and filter
- **Saved Searches**: Save search criteria for future use

### 🏠 **Property Management System**

- **Easy Listing Creation**: Step-by-step property listing wizard
- **Photo Galleries**: Multiple image upload with drag-and-drop interface
- **Property Details**: Comprehensive property information forms
- **Pricing Management**: Flexible pricing options and rental terms

### 👤 **User Authentication & Profiles**

- **Secure Registration**: Email verification and password security
- **User Profiles**: Detailed user profiles for tenants and property owners
- **Role-based Access**: Different interfaces for tenants, owners, and admins
- **Account Management**: Profile editing, password changes, and preferences

### ❤️ **Wishlist & Favorites**

- **Save Properties**: Bookmark favorite properties for later viewing
- **Comparison Tools**: Compare multiple properties side-by-side
- **Notification System**: Get notified about price changes and availability

### 📱 **Responsive Design**

- **Mobile-first Approach**: Optimized for mobile devices
- **Progressive Web App**: App-like experience in the browser
- **Touch-friendly Interface**: Intuitive touch gestures and interactions

### 🎛️ **Admin Dashboard**

- **Property Oversight**: Monitor and manage all property listings
- **User Management**: Manage user accounts and permissions
- **Analytics**: Platform usage statistics and insights
- **Content Moderation**: Review and approve property listings

## 🛠 Technology Stack

### **Frontend Framework**

- **Next.js 15**: Latest version with App Router and Turbopack for lightning-fast development
- **React 19**: Modern React with latest features and performance improvements
- **TypeScript**: Full type safety throughout the application

### **Styling & UI**

- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Beautiful, customizable icons
- **React Icons**: Additional icon library for comprehensive coverage
- **Swiper**: Touch-enabled sliders for image galleries

### **State Management**

- **Zustand**: Lightweight, scalable state management
- **Separate Stores**: Organized state management for auth, properties, and UI

### **Maps & Geolocation**

- **MapTiler SDK**: High-performance mapping solution
- **Interactive Maps**: Property location visualization and search

### **Development Tools**

- **Bun**: Ultra-fast JavaScript runtime and package manager
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing and optimization

## 📁 Detailed Project Structure

```
rentverse-frontend/
├── 📁 app/                         # Next.js App Router
│   ├── 🔐 auth/                   # Authentication pages
│   │   ├── login/                 # Login page
│   │   └── signup/                # Registration page
│   ├── 🏠 property/               # Property-related pages
│   │   ├── [id]/                  # Individual property details
│   │   ├── all/                   # Property listings
│   │   ├── new/                   # Add new property
│   │   ├── modify/                # Edit existing property
│   │   └── result/                # Search results
│   ├── 👤 account/                # User account management
│   ├── 🎛️ admin/                  # Administrative dashboard
│   ├── ❤️ wishlist/               # Saved properties
│   ├── 🏢 rents/                  # Rental management
│   └── 🔌 api/                    # API route handlers
│
├── 🧩 components/                  # Reusable UI Components
│   ├── Navigation/                # NavBar, NavBarTop, NavBarBottom
│   ├── Forms/                     # Input components, buttons
│   ├── Property/                  # CardProperty, SearchBox
│   ├── Modals/                    # Authentication modals
│   └── Layout/                    # ContentWrapper, Footer
│
├── 🗃️ stores/                     # Zustand State Management
│   ├── authStore.ts              # User authentication state
│   └── propertiesStore.ts        # Property data and filters
│
├── 📝 types/                      # TypeScript Definitions
│   ├── property.ts               # Property-related types
│   ├── auth.ts                   # Authentication types
│   ├── api.ts                    # API response types
│   └── location.ts               # Location and map types
│
├── 🛠️ utils/                      # Utility Functions
│   ├── apiForwarder.ts           # API communication helpers
│   ├── propertiesApiClient.ts    # Property API client
│   └── property.ts               # Property-related utilities
│
├── 🎨 views/                      # Complex View Components
│   ├── AddListingFirst.tsx       # Property listing wizard start
│   ├── AddListingStepOne*.tsx    # Step 1: Basic property info
│   ├── AddListingStepTwo*.tsx    # Step 2: Photos and details
│   └── AddListingStepThree*.tsx  # Step 3: Pricing and legal
│
├── 📊 data/                       # Static Data & Configuration
│   ├── properties.ts             # Sample property data
│   ├── locations.ts              # Location data
│   └── searchbox-options.ts      # Search configuration
│
└── 🖼️ public/                     # Static Assets
    ├── logo-nav.png              # Navigation logo
    └── *.svg                     # Various icons and graphics
```

## 🎯 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** or **Bun** (recommended)
- **Git** for version control
- A **MapTiler API key** for map functionality

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <your-repository-url>
   cd rentverse-frontend
   ```

2. **Install Dependencies**
   ```bash
   # Using Bun (recommended for performance)
   bun install
   
   # Or using npm
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # Backend API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   
   # AI Service Configuration (optional)
   NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001
   
   # MapTiler Configuration
   NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key_here
   
   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   
   # Optional: Additional Configuration
   NEXT_PUBLIC_APP_ENV=development
   ```

   **Note**: Copy `.env.example` to `.env.local` and update the values according to your environment.

4. **Start Development Server**
   ```bash
   # Using Bun with Turbopack (fastest)
   bun dev
   
   # Or using npm
   npm run dev
   ```

5. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗 Application Architecture

### State Management Philosophy

Rentverse uses **Zustand** for state management, chosen for its simplicity and performance:

- **authStore**: Manages user authentication, login state, and user profile
- **propertiesStore**: Handles property data, search filters, and favorites
- **Local State**: Component-specific state using React hooks

### API Architecture

The application follows a **proxy pattern** for API communication:

1. **Client-side API calls** → `/api` routes (Next.js API routes)
2. **API routes** → Backend services (authentication, data validation)
3. **Response handling** → State updates and UI feedback

### Component Hierarchy

```
App Layout (layout.tsx)
├── Navigation (NavBar)
├── Page Content
│   ├── ContentWrapper
│   ├── Feature Components
│   └── Form Components
└── Footer
```

### Routing Strategy

- **App Router**: Next.js 15 App Router for file-based routing
- **Dynamic Routes**: `[id]` for property details, user profiles
- **Protected Routes**: Authentication checks for sensitive pages
- **API Routes**: Server-side API endpoints for backend communication

## 🔧 Development Workflow

### Available Scripts

```bash
# Development with hot reloading
bun dev

# Production build
bun run build

# Start production server
bun start

# Code linting
bun run lint

# Type checking
bun run type-check
```

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency rules
- **Prettier**: Code formatting (if configured)
- **Component Standards**: PascalCase for components, camelCase for utilities

### Adding New Features

1. **Plan the Feature**: Define requirements and user stories
2. **Create Types**: Add TypeScript interfaces in `/types`
3. **Build Components**: Create reusable components in `/components`
4. **Add Pages**: Create pages in `/app` following App Router conventions
5. **Update State**: Extend Zustand stores if needed
6. **Test**: Manual testing and error checking
7. **Document**: Update README and add code comments

## 🎨 UI/UX Design System

### Color Palette

- **Primary**: Blue tones for main actions and branding
- **Secondary**: Gray scale for backgrounds and text
- **Accent**: Green for success states, red for errors

### Typography

- **Primary Font**: Manrope (modern, readable)
- **Secondary Font**: Poly (elegant, for headings)

### Component Standards

- **Consistent Spacing**: Tailwind CSS spacing scale
- **Responsive Design**: Mobile-first breakpoints
- **Accessibility**: ARIA labels and keyboard navigation

## 🗺 Application Flow

### User Journey - Tenant

1. **Discovery**: Land on homepage, see featured properties
2. **Search**: Use search box with filters to find properties
3. **Browse**: View property listings with map integration
4. **Details**: Click on property for detailed information
5. **Save**: Add properties to wishlist for later
6. **Apply**: Contact property owner or submit application

### User Journey - Property Owner

1. **Registration**: Sign up and verify account
2. **Listing Creation**: Use step-by-step wizard to add property
3. **Management**: Edit property details, pricing, availability
4. **Analytics**: View listing performance and inquiries
5. **Communication**: Respond to tenant inquiries

### Admin Operations

1. **Dashboard**: Overview of platform activity
2. **Moderation**: Review and approve new listings
3. **User Management**: Handle user accounts and issues
4. **Analytics**: Monitor platform usage and performance

## 🔐 Security Features

- **Authentication**: Secure login with email verification
- **Input Validation**: Client and server-side validation
- **API Security**: Rate limiting and request validation
- **Data Protection**: Secure handling of user information

## 🌐 Deployment Guide

### Vercel Deployment (Recommended)

1. **Connect Repository**: Link your GitHub/GitLab repository to Vercel
2. **Environment Variables**: Set required environment variables in Vercel dashboard
3. **Deploy**: Automatic deployment on every push to main branch
4. **Custom Domain**: Configure custom domain if needed

### Manual Deployment

```bash
# Build for production
bun run build

# Start production server
bun start

# Or use PM2 for process management
pm2 start "bun start" --name rentverse-frontend
```

## 📊 Performance Optimizations

- **Next.js Image Optimization**: Automatic image optimization and lazy loading
- **Turbopack**: Ultra-fast bundling for development
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Strategic caching for API responses and static assets

## 🤝 Contributing

We welcome contributions to make Rentverse even better!

### Development Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write descriptive commit messages
- Add comments for complex logic
- Ensure responsive design

## 📝 Environment Variables Reference

| Variable                       | Description               | Required | Example                 |
|--------------------------------|---------------------------|----------|-------------------------|
| `NEXT_PUBLIC_API_URL`          | Backend API base URL      | ✅        | `http://localhost:8000` |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | MapTiler API key for maps | ✅        | `pk.ey...`              |
| `NEXT_PUBLIC_APP_ENV`          | Application environment   | ❌        | `development`           |

## 🐛 Troubleshooting

### Common Issues & Solutions

**🗺️ Maps not loading**

- Verify MapTiler API key is correctly set
- Check browser console for API errors
- Ensure internet connection for external map tiles

**🔗 API connection errors**

- Verify backend API URL in environment variables
- Check if backend server is running
- Review network tab in browser developer tools

**🏗️ Build failures**

- Clear node_modules and reinstall: `rm -rf node_modules && bun install`
- Check for TypeScript errors: `bun run type-check`
- Verify all environment variables are set

**🎨 Styling issues**

- Clear browser cache and hard refresh
- Check Tailwind CSS configuration
- Verify component class names

### Development Tips

- Use `bun dev` for fastest development experience
- Enable React DevTools for component debugging
- Use browser Network tab to monitor API calls
- Check console for errors and warnings

## 📜 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support & Contact

For technical support, feature requests, or general inquiries:

- **Development Team**: Contact your project lead
- **Issues**: Create an issue in the repository
- **Documentation**: Refer to this README and inline code comments

---

**Built with ❤️ by the Rentverse team using modern web technologies**
