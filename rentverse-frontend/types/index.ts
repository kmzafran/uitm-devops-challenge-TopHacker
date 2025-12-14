// Central export point for all application types

// Authentication types
export type {
  User,
  AuthState,
  LoginFormData,
  SignUpFormData,
  EmailCheckData,
} from './auth'

// Property types
export type {
  PropertyBase,
  PropertiesState,
  PropertyType,
  SearchFilters,
} from './property'

// Search box types
export type {
  SearchBoxState,
  LocationOption,
  PropertyTypeOption,
  DurationConfig,
  SearchFormData,
  SearchBoxType,
} from './searchbox'

// Location types
export type {
  Location,
  PopularLocation,
  LocationBaseType,
  LocationCoordinates,
  DistrictLocations,
  StateLocations,
  MalaysiaLocations,
} from './location'

// API types
export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  PaginatedResponse,
  ApiRequestOptions,
  BatchOperationOptions,
  BatchOperationResult,
  CacheOptions,
  CacheEntry,
  RetryOptions,
  ServiceHealth,
  HealthCheckResponse,
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  EmailCheckRequest,
  EmailCheckResponse,
  PropertySearchRequest,
  PropertyCreateRequest,
  PropertyUpdateRequest,
  CreateRequest,
  UpdateRequest,
  DeleteRequest,
  GetRequest,
  FileUploadRequest,
  FileUploadResponse,
} from './api'


// Common utility types (keeping these here for backward compatibility)
export interface LoadingState {
  isLoading: boolean
  error: string | null
}
