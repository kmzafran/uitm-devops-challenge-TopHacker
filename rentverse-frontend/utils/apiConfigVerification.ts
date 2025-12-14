/**
 * Verification script for API URL configuration
 * Run this to test that all URLs are properly configurable
 */

import { 
  getApiBaseUrl, 
  getApiUrl, 
  getAiServiceBaseUrl,
  getAiServiceApiUrl,
  getCloudinaryBaseUrl,
  getMapTilerBaseUrl,
  createApiUrl,
  createAiServiceApiUrl,
  createCloudinaryUploadUrl,
  createMapTilerApiUrl,
  createCloudinaryAssetUrl
} from './apiConfig'

export function verifyApiConfiguration() {
  console.log('🔍 API Configuration Verification')
  console.log('================================')
  
  // Test Main API URLs
  console.log('\n📡 Main API Configuration:')
  console.log('Base URL:', getApiBaseUrl())
  console.log('API URL:', getApiUrl())
  console.log('Sample endpoint:', createApiUrl('properties'))
  console.log('Sample endpoint with ID:', createApiUrl('properties/123'))
  
  // Test AI Service URLs
  console.log('\n🤖 AI Service Configuration:')
  console.log('Base URL:', getAiServiceBaseUrl())
  console.log('API URL:', getAiServiceApiUrl())
  console.log('Price endpoint:', createAiServiceApiUrl('classify/price'))
  
  // Test Cloudinary URLs
  console.log('\n☁️ Cloudinary Configuration:')
  console.log('Base URL:', getCloudinaryBaseUrl())
  console.log('Upload URL:', createCloudinaryUploadUrl())
  console.log('Video upload URL:', createCloudinaryUploadUrl('video'))
  console.log('Asset URL:', createCloudinaryAssetUrl('sample/image'))
  console.log('Asset URL with transforms:', createCloudinaryAssetUrl('sample/image', 'f_webp,w_400'))
  
  // Test MapTiler URLs
  console.log('\n🗺️ MapTiler Configuration:')
  console.log('Base URL:', getMapTilerBaseUrl())
  console.log('Geocoding URL:', createMapTilerApiUrl('geocoding/123,456.json?key=abc'))
  
  // Test Environment Variable Detection
  console.log('\n🌍 Environment Variables:')
  console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set (using fallback)')
  console.log('NEXT_PUBLIC_AI_SERVICE_URL:', process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'Not set (using fallback)')
  console.log('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'Not set (using fallback)')
  console.log('NEXT_PUBLIC_MAPTILER_API_KEY:', process.env.NEXT_PUBLIC_MAPTILER_API_KEY ? 'Set' : 'Not set')
  
  console.log('\n✅ Configuration verification complete!')
}

// Export for use in tests or debugging
export const testUrls = {
  // Test cases for different environments
  production: {
    api: 'https://rentverse-be.jokoyuliyanto.my.id',
    ai: 'http://rentverse-ai.jokoyuliyanto.my.id',
  },
  development: {
    api: 'http://localhost:8000',
    ai: 'http://localhost:8001',
  },
  staging: {
    api: 'https://api.staging.rentverse.com',
    ai: 'https://ai.staging.rentverse.com',
  }
}

// Helper to simulate different environments
export function simulateEnvironment(env: 'production' | 'development' | 'staging') {
  const originalEnv = { ...process.env }
  
  switch (env) {
    case 'development':
      process.env.NEXT_PUBLIC_API_BASE_URL = testUrls.development.api
      process.env.NEXT_PUBLIC_AI_SERVICE_URL = testUrls.development.ai
      break
    case 'staging':
      process.env.NEXT_PUBLIC_API_BASE_URL = testUrls.staging.api
      process.env.NEXT_PUBLIC_AI_SERVICE_URL = testUrls.staging.ai
      break
    case 'production':
    default:
      delete process.env.NEXT_PUBLIC_API_BASE_URL
      delete process.env.NEXT_PUBLIC_AI_SERVICE_URL
      break
  }
  
  console.log(`\n🔄 Simulating ${env} environment:`)
  verifyApiConfiguration()
  
  // Restore original environment
  process.env = originalEnv
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyApiConfiguration()
  
  // Test different environments
  simulateEnvironment('development')
  simulateEnvironment('staging')
  simulateEnvironment('production')
}