// Test file for the distance-based auto-fill functionality
import { reverseGeocode } from './geocoding'

export async function testDistanceBasedAutoFill() {
  // Test coordinates (somewhere in Malaysia)
  const testCoordinates = [
    { lat: 3.1390, lng: 101.6869, description: "Kuala Lumpur city center" },
    { lat: 1.4927, lng: 103.7678, description: "Johor Bahru" },
    { lat: 5.4164, lng: 100.3327, description: "Penang" }
  ]

  console.log('🧪 Testing Distance-Based Auto-Fill System')
  console.log('='.repeat(50))

  for (const coord of testCoordinates) {
    console.log(`\n📍 Testing: ${coord.description}`)
    console.log(`Coordinates: ${coord.lat}, ${coord.lng}`)
    
    try {
      const result = await reverseGeocode(coord.lat, coord.lng)
      
      if (result.success && result.address) {
        console.log('✅ Auto-fill successful:')
        console.log(`   State: ${result.address.state}`)
        console.log(`   District: ${result.address.district}`)
        console.log(`   Subdistrict: ${result.address.subdistrict}`)
        console.log(`   Distance: ${result.distance?.toFixed(2)}km`)
      } else {
        console.log('❌ Auto-fill failed:', result.error)
      }
    } catch (error) {
      console.log('❌ Error:', error)
    }
  }
}

// Uncomment to run the test
// testDistanceBasedAutoFill()