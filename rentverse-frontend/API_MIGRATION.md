# API Migration: From Forwarder to Next.js Rewrites

## Overview

This migration transforms the custom API forwarding approach using Next.js API routes into a native Next.js rewrites configuration. This provides better performance and reduces the overhead of custom API route handlers.

## What Changed

### Before (API Forwarder Approach)
- Custom API routes in `/api/` and `/app/api/` directories
- Each route used `forwardRequest` from `@/utils/apiForwarder`
- Request/response handling with error management and retry logic
- Manual header forwarding and body processing

### After (Next.js Rewrites)
- Direct URL rewriting at the edge level via `next.config.ts`
- Middleware for header forwarding (especially authentication)
- Eliminates API route handler overhead
- Maintains same external API contracts

## Configuration Details

### Next.js Config (`next.config.ts`)
- **rewrites()**: Maps frontend API routes to backend endpoints
- **headers()**: Sets CORS headers for API routes
- Routes are ordered by specificity (most specific first)

### Middleware (`middleware.ts`)
- Handles authentication header forwarding
- Manages CORS preflight requests
- Provides development logging
- Only applies to `/api/*` routes

## API Route Mappings

| Frontend Route | Backend Route | Notes |
|---|---|---|
| `/api/properties` | `/api/properties` | With query string support |
| `/api/properties/featured` | `/api/properties/featured` | Featured properties |
| `/api/properties/property/:code` | `/api/properties/property/:code` | Property by code/slug |
| `/api/properties/:id` | `/api/properties/:id` | Property by ID |
| `/api/properties/:id/view` | `/api/properties/:id/view` | Property view tracking |
| `/api/auth/login` | `/api/auth/login` | User authentication |
| `/api/auth/signup` | `/api/auth/signup` | User registration |
| `/api/auth/register` | `/api/auth/register` | Alternative registration |
| `/api/auth/validate` | `/api/auth/me` | ⚠️ Maps to `/me` endpoint |
| `/api/auth/me` | `/api/auth/me` | Current user info |
| `/api/auth/check-email` | `/api/auth/check-email` | Email validation |
| `/api/upload/multiple` | `/api/upload/multiple` | File uploads |
| `/api/:path*` | `/api/:path*` | Catchall for other routes |

## Environment Variables

The configuration uses the same environment variables:
- `API_BASE_URL` (primary)
- `NEXT_PUBLIC_API_BASE_URL` (fallback)
- Default: `http://localhost:8000`

## Features Preserved

1. **Authentication**: Authorization headers are forwarded via middleware
2. **Query Parameters**: Automatically preserved in rewrites
3. **Request Methods**: All HTTP methods (GET, POST, PUT, DELETE, etc.)
4. **Request Bodies**: JSON and FormData bodies are forwarded
5. **CORS**: Properly configured for cross-origin requests
6. **Development Logging**: Similar logging to original forwarder

## Features Not Directly Preserved

The following features from the original `apiForwarder` are not available with rewrites:

1. **Retry Logic**: No automatic retry on failure
2. **Custom Timeouts**: Uses default fetch timeouts
3. **Exponential Backoff**: No retry delays
4. **Custom Error Handling**: Backend errors pass through directly
5. **Response Caching**: Cache headers must be set by backend

## Migration Impact

### Benefits
- **Performance**: Eliminates API route overhead
- **Simplicity**: Fewer files to maintain
- **Edge Optimization**: Rewrites happen at CDN/edge level
- **Standard Approach**: Uses Next.js built-in features

### Considerations
- **Error Handling**: Backend must provide appropriate error responses
- **Timeouts**: Configure backend timeouts appropriately
- **Monitoring**: May need different monitoring for direct proxy

## Files Removed/Modified

### Files that can be removed:
- `/api/properties/route.ts`
- `/api/properties/[id]/route.ts`
- `/api/properties/featured/route.ts`
- `/api/properties/property/[code]/route.ts`
- `/app/api/auth/login/route.ts`
- `/app/api/auth/signup/route.ts`
- `/app/api/auth/register/route.ts`
- `/app/api/auth/validate/route.ts`
- `/app/api/auth/me/route.ts`
- `/app/api/auth/check-email/route.ts`
- `/app/api/properties/[id]/view/route.ts`
- `/app/api/upload/multiple/route.ts`

### Files modified:
- `next.config.ts` - Added rewrites and headers configuration
- Created `middleware.ts` - For authentication and CORS handling

### Files that can remain:
- `utils/apiForwarder.ts` - Can be kept for reference or other uses
- Other non-API route files

## Testing

After migration, verify:

1. **Authentication flows** work correctly
2. **File uploads** function properly  
3. **Query parameters** are preserved
4. **Error responses** from backend are appropriate
5. **CORS requests** work from frontend applications

## Rollback Plan

If issues arise, you can quickly rollback by:
1. Reverting `next.config.ts` changes
2. Removing `middleware.ts`
3. Restoring the original API route files
4. The `apiForwarder` utility remains unchanged for easy restoration