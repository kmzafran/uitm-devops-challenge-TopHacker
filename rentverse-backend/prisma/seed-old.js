const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { seedPenangProjects } = require('./seeders/projects');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create PropertyTypes first
  const apartmentType = await prisma.propertyType.create({
    data: {
      code: 'APARTMENT',
      name: 'Apartemen',
      description: 'Unit hunian dalam bangunan bertingkat',
      isActive: true,
    },
  });

  const houseType = await prisma.propertyType.create({
    data: {
      code: 'HOUSE',
      name: 'Rumah',
      description: 'Rumah tinggal standalone',
      isActive: true,
    },
  });

  const studioType = await prisma.propertyType.create({
    data: {
      code: 'STUDIO',
      name: 'Studio',
      description: 'Unit studio dengan konsep open space',
      isActive: true,
    },
  });

  // Create Amenities
  const ac = await prisma.amenity.create({
    data: {
      name: 'AC',
      category: 'Comfort',
    },
  });

  const pool = await prisma.amenity.create({
    data: {
      name: 'Swimming Pool',
      category: 'Recreation',
    },
  });

  const parking = await prisma.amenity.create({
    data: {
      name: 'Parking',
      category: 'Utility',
    },
  });

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@rentverse.com',
      name: 'Admin User',
      phone: '+1234567890',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const landlord = await prisma.user.create({
    data: {
      email: 'landlord@rentverse.com',
      name: 'John Landlord',
      phone: '+1234567891',
      password: hashedPassword,
      role: 'LANDLORD',
    },
  });

  const tenant = await prisma.user.create({
    data: {
      email: 'tenant@rentverse.com',
      name: 'Jane Tenant',
      phone: '+1234567892',
      password: hashedPassword,
      role: 'TENANT',
    },
  });

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      code: 'APT001',
      title: 'Beautiful Downtown Apartment',
      description: 'A stunning 2-bedroom apartment in the heart of the city with modern amenities.',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'US',
      zipCode: '10001',
      price: 2500.00,
      currencyCode: 'USD',
      bedrooms: 2,
      bathrooms: 2,
      areaSqm: 85.5,
      furnished: true,
      isAvailable: true,
      status: 'APPROVED',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858'
      ],
      ownerId: landlord.id,
      propertyTypeId: apartmentType.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      code: 'STU001',
      title: 'Cozy Studio Near Park',
      description: 'A cozy studio apartment perfect for students or young professionals.',
      address: '456 Park Avenue',
      city: 'New York',
      state: 'NY',
      country: 'US',
      zipCode: '10002',
      price: 1200.00,
      currencyCode: 'USD',
      bedrooms: 0,
      bathrooms: 1,
      areaSqm: 35.0,
      furnished: false,
      isAvailable: true,
      status: 'APPROVED',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'
      ],
      ownerId: landlord.id,
      propertyTypeId: studioType.id,
    },
  });

  // Connect amenities to properties
  await prisma.propertyAmenity.createMany({
    data: [
      { propertyId: property1.id, amenityId: ac.id },
      { propertyId: property1.id, amenityId: pool.id },
      { propertyId: property1.id, amenityId: parking.id },
      { propertyId: property2.id, amenityId: ac.id },
    ],
  });

  console.log('✅ Basic seed completed successfully!');
  console.log('📊 Created:');
  console.log(`  - ${3} users (Admin, Landlord, Tenant)`);
  console.log(`  - ${3} property types`);
  console.log(`  - ${3} amenities`);
  console.log(`  - ${2} properties`);

  // Seed Malaysia projects
  console.log('\n🏢 Starting Malaysia projects seeding...');
  await seedPenangProjects();

  console.log('\n🎉 All seeding completed successfully!');
  console.log('🔑 Demo credentials:');
  console.log('  Admin: admin@rentverse.com / password123');
  console.log('  Landlord: landlord@rentverse.com / password123');
  console.log('  Tenant: tenant@rentverse.com / password123');
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
