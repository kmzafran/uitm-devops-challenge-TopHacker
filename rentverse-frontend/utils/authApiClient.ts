import type { RegisterRequest, AuthResponse } from '@/types/auth'
import { forwardRequest } from './apiForwarder'

/**
 * Authentication API client
 */
export class AuthApiClient {
  
  /**
   * Register a new user
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await forwardRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      return data as AuthResponse
    } catch (error) {
      console.error('Registration API error:', error)
      throw error instanceof Error ? error : new Error('Network error occurred')
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await forwardRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      return data as AuthResponse
    } catch (error) {
      console.error('Login API error:', error)
      throw error instanceof Error ? error : new Error('Network error occurred')
    }
  }

  /**
   * Check if email exists
   */
  static async checkEmail(email: string): Promise<{ exists: boolean; isActive: boolean; role: string | null }> {
    try {
      const response = await forwardRequest('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Email check failed')
      }

      return data.data
    } catch (error) {
      console.error('Email check API error:', error)
      throw error instanceof Error ? error : new Error('Network error occurred')
    }
  }

  /**
   * Get current user data
   */
  static async getCurrentUser(token: string): Promise<AuthResponse['data']['user']> {
    try {
      const response = await forwardRequest('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user data')
      }

      return data.data
    } catch (error) {
      console.error('Get user API error:', error)
      throw error instanceof Error ? error : new Error('Network error occurred')
    }
  }
}