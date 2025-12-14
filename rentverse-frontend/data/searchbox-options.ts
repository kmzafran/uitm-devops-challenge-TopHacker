interface LocationType {
  icon: string
  name: string
  description: string
}

interface PropertyType {
  icon: string
  name: string
  description: string
}

type GetAllLocationsType = () => Array<LocationType>
type GetAllPropertyTypesType = () => Array<PropertyType>

const locations: Array<LocationType> = [
  {
    icon: '🏛️',
    name: 'George Town, Penang',
    description: 'UNESCO World Heritage Site with rich culture',
  },
  {
    icon: '🏢',
    name: 'Kuala Lumpur',
    description: 'Malaysia\'s bustling capital city',
  },
  {
    icon: '🌴',
    name: 'Langkawi, Kedah',
    description: 'Tropical island paradise',
  },
  {
    icon: '🏖️',
    name: 'Kota Kinabalu, Sabah',
    description: 'Gateway to Borneo adventures',
  },
  {
    icon: '🏞️',
    name: 'Cameron Highlands, Pahang',
    description: 'Cool climate and tea plantations',
  },
  {
    icon: '🕌',
    name: 'Putrajaya',
    description: 'Malaysia\'s administrative capital',
  },
  {
    icon: '🏰',
    name: 'Malacca City, Melaka',
    description: 'Historic city with colonial architecture',
  },
  {
    icon: '🌊',
    name: 'Kuching, Sarawak',
    description: 'Cat city with cultural diversity',
  },
  {
    icon: '🏔️',
    name: 'Ipoh, Perak',
    description: 'Limestone caves and heritage buildings',
  },
  {
    icon: '🌺',
    name: 'Johor Bahru, Johor',
    description: 'Modern city near Singapore',
  },
]

const propertyTypes: Array<PropertyType> = [
  {
    icon: '🏢',
    name: 'Property',
    description: 'All types of properties',
  },
  {
    icon: '🏬',
    name: 'Condominium',
    description: 'Modern condo living',
  },
  {
    icon: '🏠',
    name: 'Apartment',
    description: 'Urban apartment units',
  },
  {
    icon: '🏡',
    name: 'House',
    description: 'Single family homes',
  },
  {
    icon: '🏘️',
    name: 'Townhouse',
    description: 'Multi-story attached homes',
  },
  {
    icon: '🏰',
    name: 'Villa',
    description: 'Luxury standalone villas',
  },
  {
    icon: '🏙️',
    name: 'Penthouse',
    description: 'Top-floor luxury units',
  },
]

export const getAllLocations: GetAllLocationsType = () => {
  return locations
}

export const getAllPropertyTypes: GetAllPropertyTypesType = () => {
  return propertyTypes
}

// Property types for listing creation (excludes generic "Property" option)
export const getPropertyTypesForListing: GetAllPropertyTypesType = () => {
  return propertyTypes.filter(type => type.name !== 'Property')
}
