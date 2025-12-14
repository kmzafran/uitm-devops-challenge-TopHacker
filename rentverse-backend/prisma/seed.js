const { prisma } = require('../src/config/database');
const {
  seedPropertyTypes,
  seedAmenities, 
  seedUsers,
  seedProperties
} = require('./seeders');

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    const results = {};

    // 1. Seed Property Types first (required by properties)
    console.log('1️⃣ Seeding Property Types...');
    results.propertyTypes = await seedPropertyTypes();
    console.log('');

    // 2. Seed Amenities (can be independent)
    console.log('2️⃣ Seeding Amenities...');
    results.amenities = await seedAmenities();
    console.log('');

    // 3. Seed Users (required by properties)
    console.log('3️⃣ Seeding Users...');
    results.users = await seedUsers();
    console.log('');

    // 4. Seed Properties (requires users, property types, and amenities)
    console.log('4️⃣ Seeding Sample Properties...');
    results.properties = await seedProperties();
    console.log('');

    // Final summary
    console.log('🎉 ===== SEEDING COMPLETED SUCCESSFULLY ===== 🎉\n');
    
    console.log('📊 Summary:');
    console.log(`✅ Property Types: ${results.propertyTypes?.created || 0} processed`);
    console.log(`✅ Amenities: ${results.amenities?.created || 0} processed`);
    console.log(`✅ Users: ${results.users?.created || 0} created`);
    console.log(`✅ Properties: ${results.properties?.created || 0} created`);

    console.log('\n🔑 Demo Credentials (password: password123):');
    console.log('   Admin: admin@rentverse.com');
    console.log('   Landlord: landlord@rentverse.com');
    console.log('   Tenant: tenant@rentverse.com');

    console.log('\n🚀 Server endpoints:');
    console.log('   API Documentation: http://localhost:3000/docs');
    console.log('   Health Check: http://localhost:3000/health');
    console.log('   API Base: http://localhost:3000/api');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
