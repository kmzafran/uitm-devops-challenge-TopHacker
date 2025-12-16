# Fix Map Dataset & Map Markers Guide

This guide documents the fixes implemented to correctly import property datasets and display accurate map markers in the RentVerse application.

---

## Table of Contents

1. [Dataset Statistics](#1-dataset-statistics)
2. [Dataset Import Fixes](#2-dataset-import-fixes)
3. [Location Filter Fixes](#3-location-filter-fixes)
4. [Map Marker Implementation](#4-map-marker-implementation)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Dataset Statistics

### Total Properties in Database
**1,119 properties** successfully imported from the fazwaz.my dataset.

### Properties by Region

| State/Region | Property Count |
|--------------|----------------|
| Selangor | 365 |
| Kuala Lumpur | 298 |
| Penang | 162 |
| Johor | 158 |
| Melaka | 35 |
| Negeri Sembilan | 31 |
| Kedah | 21 |
| Pahang | 13 |
| Sarawak | 12 |
| Perak | 10 |
| Sabah | 7 |
| Putrajaya | 7 |
| **Total** | **1,119** |

### Regions with No Data
The following regions have no properties in the dataset (limitation of source data):
- Labuan (0 listings)
- Perlis (0 listings)
- Terengganu (0 listings)
- Kelantan (0 listings)

> **Note:** This is a limitation of the scraped data from fazwaz.my, not a bug in the application.

---

## 2. Dataset Import Fixes

### Problem
The original CSV dataset from fazwaz.my had inconsistent data formatting and missing geocoding information.

### Solution

**File: `rentverse-backend/src/scripts/importProperties.js`**

Key fixes implemented:

#### a) Robust CSV Parsing
```javascript
import { parse } from 'csv-parse';

const parser = parse({
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
});
```

#### b) State-based Geocoding
Since the scraped data lacks precise coordinates, we use approximate coordinates based on the property's state:

```javascript
const STATE_COORDINATES = {
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'Selangor': { lat: 3.0738, lng: 101.5183 },
  'Penang': { lat: 5.4141, lng: 100.3288 },
  'Johor': { lat: 1.4927, lng: 103.7414 },
  // ... more states
};
```

#### c) Data Extraction
Extract and normalize fields from the CSV:
- `title` - Property title
- `price` - Extract numeric value from formatted string
- `bedrooms`, `bathrooms` - Parse from property details
- `state`, `city` - Parse from location field
- `address` - Full address string

### Running the Import
```bash
cd rentverse-backend
node src/scripts/importProperties.js
```

---

## 3. Location Filter Fixes

### Problem
Properties weren't filtering correctly by location due to Prisma query structure issues.

### Solution

**File: `rentverse-backend/src/modules/properties/properties.service.js`**

#### a) Combine Status Filter with Location Filter
The `OR` clause for location must be wrapped in `AND` to work with other filters:

```javascript
// ✅ Correct - Uses AND to combine with status filter
if (filters.city) {
  where.AND = [
    {
      OR: [
        { city: { contains: filters.city, mode: 'insensitive' } },
        { state: { contains: filters.city, mode: 'insensitive' } },
        { address: { contains: filters.city, mode: 'insensitive' } },
      ],
    },
  ];
}

// ❌ Wrong - This would override the status filter
// where.OR = [...]
```

#### b) Fix Count Function Parameter
```javascript
// ✅ Correct
propertiesRepository.count({ where })

// ❌ Wrong
propertiesRepository.count(where)
```

---

## 4. Map Marker Implementation

### Problem
Map markers weren't displaying or were appearing at wrong locations.

### Files Modified:
- `rentverse-frontend/components/MapViewer.tsx`
- `rentverse-frontend/app/property/result/page.tsx`

### Solution

#### a) MapViewer Component Setup

```typescript
// Initialize with MapTiler SDK
import * as maptilersdk from '@maptiler/sdk';

// Set API key
maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

// Create map with center on Malaysia
new maptilersdk.Map({
  container: mapContainer.current,
  style: maptilersdk.MapStyle.STREETS,
  center: [101.6953, 3.1390], // Kuala Lumpur
  zoom: 10,
});
```

#### b) Adding Markers

```typescript
interface Marker {
  lat: number;
  lng: number;
  popup?: string;
  color?: string;
}

// Create marker with popup
const marker = new maptilersdk.Marker({
  color: markerData.color || '#3B82F6',
})
  .setLngLat([markerData.lng, markerData.lat])
  .addTo(mapInstance);

if (markerData.popup) {
  const popup = new maptilersdk.Popup({
    offset: 25,
    closeButton: true,
  }).setHTML(markerData.popup);
  marker.setPopup(popup);
}
```

#### c) Result Page Integration

```typescript
// Build markers from properties
const propertyMarkers = useMemo(() => {
  return properties
    .filter((p) => p.latitude && p.longitude)
    .map((property) => ({
      lat: property.latitude,
      lng: property.longitude,
      popup: `<div><strong>${property.title}</strong><br/>RM ${property.price}/mo</div>`,
      color: '#3B82F6',
    }));
}, [properties]);

// Use in MapViewer
<MapViewer
  center={mapCenter}
  markers={propertyMarkers}
  zoom={10}
/>
```

#### d) Dynamic Map Center
Calculate center from API response:

```typescript
const mapCenter = useMemo(() => {
  if (mapData?.latMean && mapData?.longMean) {
    return { lng: mapData.longMean, lat: mapData.latMean };
  }
  return { lng: 101.6953, lat: 3.1390 }; // Fallback to KL
}, [mapData]);
```

---

## 5. Troubleshooting

### Markers Not Appearing
1. Check if properties have valid `latitude` and `longitude` values
2. Verify MapTiler API key is set in `.env.local`
3. Ensure the map has finished loading before adding markers

### Filter Not Working
1. Restart the backend server after code changes
2. Check browser console for API response
3. Verify the Prisma `where` clause structure

### Wrong Location Data
1. Re-run the import script with updated state coordinates
2. Check the CSV data for state/city parsing issues
3. Verify the `STATE_COORDINATES` mapping is complete

---

## Environment Variables

```env
# Backend (.env)
DATABASE_URL="postgresql://..."

# Frontend (.env.local)
NEXT_PUBLIC_MAPTILER_API_KEY="your-maptiler-api-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## Summary of Key Changes

| File | Change |
|------|--------|
| `importProperties.js` | Added csv-parse, state geocoding, data normalization |
| `properties.service.js` | Fixed Prisma filter with AND/OR, fixed count() params |
| `MapViewer.tsx` | Added marker support with popups, null safety checks |
| `result/page.tsx` | Added property markers, dynamic map center |

---

*Last updated: December 2024*
