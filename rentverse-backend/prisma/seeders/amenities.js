const { prisma } = require('../../src/config/database');

const amenities = [
  // Comfort & Climate
  { name: 'Air Conditioning', category: 'Comfort' },
  { name: 'Central Air Conditioning', category: 'Comfort' },
  { name: 'Heating System', category: 'Comfort' },
  { name: 'Ceiling Fan', category: 'Comfort' },
  
  // Security & Safety
  { name: '24-Hour Security', category: 'Security' },
  { name: 'CCTV Surveillance', category: 'Security' },
  { name: 'Access Card System', category: 'Security' },
  { name: 'Security Guard', category: 'Security' },
  { name: 'Intercom System', category: 'Security' },
  { name: 'Fire Safety System', category: 'Security' },
  
  // Recreation & Fitness
  { name: 'Swimming Pool', category: 'Recreation' },
  { name: 'Infinity Pool', category: 'Recreation' },
  { name: 'Children\'s Pool', category: 'Recreation' },
  { name: 'Gymnasium', category: 'Recreation' },
  { name: 'Fitness Center', category: 'Recreation' },
  { name: 'Yoga Studio', category: 'Recreation' },
  { name: 'Tennis Court', category: 'Recreation' },
  { name: 'Badminton Court', category: 'Recreation' },
  { name: 'Basketball Court', category: 'Recreation' },
  { name: 'Jogging Track', category: 'Recreation' },
  { name: 'Children\'s Playground', category: 'Recreation' },
  { name: 'Game Room', category: 'Recreation' },
  { name: 'Pool Table', category: 'Recreation' },
  
  // Parking & Transportation
  { name: 'Covered Parking', category: 'Parking' },
  { name: 'Open Parking', category: 'Parking' },
  { name: 'Valet Parking', category: 'Parking' },
  { name: 'Electric Car Charging', category: 'Parking' },
  { name: 'Shuttle Service', category: 'Transportation' },
  { name: 'LRT Access', category: 'Transportation' },
  { name: 'MRT Access', category: 'Transportation' },
  { name: 'Bus Stop Nearby', category: 'Transportation' },
  
  // Amenities & Facilities
  { name: 'Elevator', category: 'Facilities' },
  { name: 'Private Lift Lobby', category: 'Facilities' },
  { name: 'Concierge Service', category: 'Facilities' },
  { name: 'Reception Desk', category: 'Facilities' },
  { name: 'Mail Room', category: 'Facilities' },
  { name: 'Package Receiving', category: 'Facilities' },
  { name: 'Laundry Room', category: 'Facilities' },
  { name: 'Dry Cleaning Service', category: 'Facilities' },
  
  // Social & Entertainment
  { name: 'BBQ Area', category: 'Social' },
  { name: 'Function Hall', category: 'Social' },
  { name: 'Meeting Room', category: 'Social' },
  { name: 'Business Center', category: 'Social' },
  { name: 'Co-working Space', category: 'Social' },
  { name: 'Library', category: 'Social' },
  { name: 'Sky Lounge', category: 'Social' },
  { name: 'Rooftop Garden', category: 'Social' },
  { name: 'Landscape Garden', category: 'Social' },
  
  // Connectivity & Technology
  { name: 'High-Speed Internet', category: 'Technology' },
  { name: 'Fiber Internet', category: 'Technology' },
  { name: 'WiFi Coverage', category: 'Technology' },
  { name: 'Smart Home Technology', category: 'Technology' },
  { name: 'Cable TV Ready', category: 'Technology' },
  
  // Commercial & Retail
  { name: 'Shopping Mall', category: 'Commercial' },
  { name: 'Retail Shops', category: 'Commercial' },
  { name: 'Convenience Store', category: 'Commercial' },
  { name: 'Food Court', category: 'Commercial' },
  { name: 'Restaurant', category: 'Commercial' },
  { name: 'Cafe', category: 'Commercial' },
  { name: 'Bank', category: 'Commercial' },
  { name: 'ATM', category: 'Commercial' },
  
  // Health & Wellness
  { name: 'Medical Center', category: 'Health' },
  { name: 'Clinic', category: 'Health' },
  { name: 'Pharmacy', category: 'Health' },
  { name: 'Spa & Wellness', category: 'Health' },
  { name: 'Sauna', category: 'Health' },
  { name: 'Steam Room', category: 'Health' },
  
  // Education & Learning
  { name: 'International School', category: 'Education' },
  { name: 'Kindergarten', category: 'Education' },
  { name: 'Tuition Center', category: 'Education' },
  { name: 'Study Room', category: 'Education' },
  
  // Environment & Sustainability
  { name: 'Green Building', category: 'Environment' },
  { name: 'Solar Panels', category: 'Environment' },
  { name: 'Rainwater Harvesting', category: 'Environment' },
  { name: 'Waste Management', category: 'Environment' },
  { name: 'Recycling Center', category: 'Environment' },
  
  // Special Features
  { name: 'Marina Access', category: 'Special' },
  { name: 'Beach Access', category: 'Special' },
  { name: 'Golf Course', category: 'Special' },
  { name: 'Theme Park Access', category: 'Special' },
  { name: 'Convention Center', category: 'Special' },
  { name: 'Hotel Services', category: 'Special' }
];

async function seedAmenities() {
  console.log('🎯 Starting amenities seeding...');

  try {
    let createdCount = 0;
    let skippedCount = 0;

    for (const amenityData of amenities) {
      try {
        // Use upsert to handle existing records
        const amenity = await prisma.amenity.upsert({
          where: { name: amenityData.name },
          update: {
            category: amenityData.category
          },
          create: amenityData
        });

        if (amenity) {
          createdCount++;
        }

      } catch (error) {
        console.error(`❌ Error with amenity "${amenityData.name}":`, error.message);
        skippedCount++;
      }
    }

    console.log(`✅ Successfully processed: ${createdCount} amenities`);
    
    // Show summary by category
    const categorySummary = await prisma.amenity.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    console.log('\n📊 Amenities by Category:');
    for (const cat of categorySummary) {
      console.log(`   ${cat.category || 'No Category'}: ${cat._count.id} amenities`);
    }

    return { success: true, created: createdCount };

  } catch (error) {
    console.error('❌ Error during amenities seeding:', error);
    throw error;
  }
}

// Function to clean up amenities
async function cleanupAmenities() {
  console.log('🧹 Cleaning up existing amenities...');
  
  try {
    const deleted = await prisma.amenity.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.count} amenities`);
    return deleted.count;
  } catch (error) {
    console.error('❌ Error cleaning up amenities:', error);
    throw error;
  }
}

module.exports = {
  seedAmenities,
  cleanupAmenities,
  amenities
};

// Allow direct execution
if (require.main === module) {
  async function main() {
    try {
      await seedAmenities();
    } catch (error) {
      console.error('❌ Amenities seeding failed:', error);
      process.exit(1);
    }
  }

  main();
}
