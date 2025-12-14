# Property View Logging Integration

This document describes the integration for the backend property view logging endpoint.

## Overview

The property view logging integration allows the frontend to track when users view properties by making a POST request to the backend endpoint `/api/properties/{id}/view`.

## API Endpoint

**Backend Endpoint:** `POST /api/properties/{id}/view`

**Example cURL:**
```bash
curl -X 'POST' \
  'https://rentverse-be.jokoyuliyanto.my.id/api/properties/a4612df6-e71f-499b-b35e-b3151a522801/view' \
  -H 'accept: application/json' \
  -d ''
```

**Response (200):**
```json
{
  "success": true,
  "message": "View logged successfully",
  "data": {
    "property": {
      "id": "a4612df6-e71f-499b-b35e-b3151a522801",
      "title": "Garden Apartment in Botanical Gardens Area",
      "viewCount": 1,
      "owner": {
        "id": "e30f3c3c-2f67-47f0-b39a-56bfad33acb1",
        "name": "John Landlord",
        "email": "landlord@rentverse.com",
        "phone": "+60123456788"
      },
      // ... full property details
    },
    "viewLogged": true
  }
}
```

## Integration Components

### 1. Type Definitions (`types/property.ts`)

Enhanced the `Property` interface to include all fields from the backend response:

```typescript
export interface Property {
  id: string
  title: string
  viewCount: number
  owner?: PropertyOwner
  propertyType?: PropertyTypeDetail
  amenities: string[] | PropertyAmenity[]
  // ... other fields
}

export interface PropertyViewResponse {
  success: boolean
  message: string
  data: {
    property: Property
    viewLogged: boolean
  }
}
```

### 2. API Client (`utils/propertiesApiClient.ts`)

Created `PropertiesApiClient` with view logging functionality:

```typescript
export class PropertiesApiClient {
  static async logPropertyView(propertyId: string): Promise<PropertyViewResponse> {
    // Implementation
  }
  
  // Other property-related methods...
}
```

### 3. Next.js API Route (`app/api/properties/[id]/view/route.ts`)

Forwards requests to the backend:

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Forward to backend and return response
}
```

### 4. Store Integration (`stores/propertiesStore.ts`)

Added view logging to the properties store:

```typescript
const usePropertiesStore = create<PropertiesStore>((set, get) => ({
  // ... other store methods
  
  logPropertyView: async (propertyId: string) => {
    const response = await PropertiesApiClient.logPropertyView(propertyId)
    // Update property in store with new view count
    return response.data.property
  },
}))
```

### 5. Custom Hooks (`hooks/usePropertyView.ts`)

Two hooks for different use cases:

- `usePropertyView()` - Manual view logging
- `useAutoPropertyView()` - Automatic view logging on mount

### 6. React Components (`components/PropertyViewTracker.tsx`)

Example components showing how to use the integration:

- `PropertyViewTracker` - Auto-logs views when component mounts
- `PropertyViewButton` - Manual view logging button

## Usage Examples

### Automatic View Logging

Wrap any property component to automatically log views:

```tsx
import { PropertyViewTracker } from '@/components/PropertyViewTracker'

function PropertyDetailPage({ propertyId }: { propertyId: string }) {
  return (
    <PropertyViewTracker propertyId={propertyId}>
      <div>
        {/* Property content */}
      </div>
    </PropertyViewTracker>
  )
}
```

### Manual View Logging

Use the hook for manual control:

```tsx
import { usePropertyView } from '@/hooks/usePropertyView'

function PropertyCard({ property }: { property: Property }) {
  const { logView, isLogging } = usePropertyView()
  
  const handleView = async () => {
    const updatedProperty = await logView(property.id)
    if (updatedProperty) {
      console.log('View count:', updatedProperty.viewCount)
    }
  }
  
  return (
    <div onClick={handleView}>
      {/* Property card content */}
      Views: {property.viewCount}
    </div>
  )
}
```

### Using the Store Directly

```tsx
import usePropertiesStore from '@/stores/propertiesStore'

function MyComponent() {
  const logPropertyView = usePropertiesStore(state => state.logPropertyView)
  
  const handleClick = async () => {
    const property = await logPropertyView('property-id')
    // Handle result
  }
}
```

## Features

- ✅ **Type Safety** - Full TypeScript support with proper interfaces
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Store Integration** - Updates property data in the global store
- ✅ **Automatic Updates** - View count automatically updates in UI
- ✅ **Flexible Usage** - Both automatic and manual logging options
- ✅ **Performance** - Prevents duplicate logging during ongoing requests
- ✅ **Development Support** - Debug information in development mode

## API Flow

```
Frontend Component
    ↓
Custom Hook / Store
    ↓
PropertiesApiClient
    ↓
Next.js API Route (/app/api/properties/[id]/view)
    ↓
Backend API (/api/properties/{id}/view)
```

## Error Handling

The integration includes robust error handling at multiple levels:

1. **API Client Level** - Network errors, HTTP errors
2. **Store Level** - Updates error state for UI feedback
3. **Hook Level** - Component-level error handling
4. **Component Level** - Optional error display

## Best Practices

1. **Use `PropertyViewTracker`** for automatic logging on property detail pages
2. **Use `usePropertyView` hook** for manual control over when views are logged
3. **Check `isLogging` state** to prevent duplicate requests
4. **Handle errors gracefully** - view logging failures shouldn't break the UI
5. **Use development mode** to debug view logging behavior

## Integration Status

✅ **Complete** - Ready for production use

All components are implemented and working together to provide a seamless property view tracking experience.