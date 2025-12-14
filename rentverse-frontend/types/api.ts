// API-related types for mock and real API interactions

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T | null
  message: string
  success: boolean
  status: number
}

// API error types
export interface ApiError {
  message: string
  status: number
  code?: string
  details?: Record<string, unknown>
}

// Pagination types for API responses
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// API request options
export interface ApiRequestOptions {
  delay?: number
  errorRate?: number
  timeout?: number
  retries?: number
}

// Batch operation types
export interface BatchOperationOptions {
  failFast?: boolean
  maxConcurrent?: number
  timeout?: number
}

export interface BatchOperationResult<T> {
  success: boolean
  results: Array<ApiResponse<T>>
  errors: ApiError[]
}

// Cache types
export interface CacheOptions {
  ttl?: number
  key?: string
  invalidatePattern?: string
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

// Retry configuration
export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  backoff?: boolean
  retryCondition?: (error: ApiError) => boolean
}

// Health check types
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastCheck: number
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'down'
  timestamp: number
  services: Record<string, ServiceHealth>
  uptime: number
}

// Authentication API types
export interface LoginRequest {
  email: string
  password: string
}

import { User } from './auth'

export interface LoginResponse {
  user: User
  token: string
  refreshToken?: string
  expiresIn: number
}

export interface SignUpRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  birthdate?: string
}

export interface EmailCheckRequest {
  email: string
}

export interface EmailCheckResponse {
  exists: boolean
  available: boolean
  suggestions?: string[]
}

// Properties API types
export interface PropertySearchRequest {
  location?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  page?: number
  limit?: number
}

export interface PropertyCreateRequest {
  title: string
  location: string
  price: number
  area: number
  propertyType: string
  propertyTypeId: string
  imageUrl?: string
  description?: string
}

export interface PropertyUpdateRequest {
  title?: string
  location?: string
  price?: number
  area?: number
  propertyType?: string
  propertyTypeId?: string
  imageUrl?: string
  description?: string
}

// Generic CRUD operation types
export interface CreateRequest<T> {
  data: T
  options?: ApiRequestOptions
}

export interface UpdateRequest<T> {
  id: string
  data: Partial<T>
  options?: ApiRequestOptions
}

export interface DeleteRequest {
  id: string
  options?: ApiRequestOptions
}

export interface GetRequest {
  id?: string
  params?: Record<string, string | number | boolean>
  options?: ApiRequestOptions
}

// File upload types
export interface FileUploadRequest {
  file: File
  folder?: string
  filename?: string
  metadata?: Record<string, string | number | boolean>
}

export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  type: string
  uploadedAt: number
}
