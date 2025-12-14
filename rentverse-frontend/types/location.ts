// Location data types
export interface Location {
  id: string
  name: string
  description: string
  icon: string
  country?: string
  state?: string
  city?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

// Popular location types
export interface PopularLocation extends Location {
  imageUrl: string
  propertyCount: number
  averagePrice: number
}

// Base location type for popular locations data
export interface LocationBaseType {
  name: string
  imageUrl: string
  latitude: number
  longitude: number
}

// Types for the comprehensive locations data structure
export interface LocationCoordinates {
  name: string
  longitude: number
  latitude: number
}

export interface DistrictLocations {
  [districtName: string]: LocationCoordinates[]
}

export interface StateLocations {
  [stateName: string]: DistrictLocations
}

export interface MalaysiaLocations {
  [stateName: string]: DistrictLocations
}
