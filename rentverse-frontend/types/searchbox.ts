// Search box UI state types
export interface SearchBoxState {
  isWhereOpen: boolean
  isDurationOpen: boolean
  isTypeOpen: boolean
  whereValue: string
  typeValue: string
  monthCount: number
  yearCount: number
}

// Location and property type option types
export interface LocationOption {
  icon: string
  name: string
  description: string
}

export interface PropertyTypeOption {
  icon: string
  name: string
  description: string
}

// Duration display types
export interface DurationConfig {
  monthCount: number
  yearCount: number
}

// Search form data
export interface SearchFormData {
  location: string
  duration: DurationConfig
  propertyType: string
}

// Search box type
export type SearchBoxType = 'full' | 'compact' | 'none'
