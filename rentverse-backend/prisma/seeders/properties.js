const { prisma } = require('../../src/config/database');

async function seedProperties() {
  console.log('🏠 Starting properties seeding...');

  try {
    // Get required data first
    const landlord = await prisma.user.findFirst({
      where: { role: 'USER' }
    });

    if (!landlord) {
      throw new Error('No user found. Please run users seeder first.');
    }

    const apartmentType = await prisma.propertyType.findUnique({
      where: { code: 'APARTMENT' }
    });

    const condominiumType = await prisma.propertyType.findUnique({
      where: { code: 'CONDOMINIUM' }
    });

    if (!apartmentType || !condominiumType) {
      throw new Error('Property types not found. Please run property types seeder first.');
    }

    // Get some amenities
    const amenities = await prisma.amenity.findMany({
      where: {
        name: {
          in: ['Air Conditioning', 'Swimming Pool', 'Covered Parking', 'Gymnasium', '24-Hour Security']
        }
      }
    });

    // Sample properties data
    const properties = [
      {
        title: 'Luxury Penthouse at KLCC',
        description: 'Stunning 3-bedroom penthouse with panoramic city views in the heart of Kuala Lumpur. Features marble flooring, high-end appliances, and private elevator access.',
        address: 'Jalan Ampang, KLCC',
        city: 'Kuala Lumpur',
        state: 'Kuala Lumpur',
        zipCode: '50088',
        price: 8500.00,
        bedrooms: 3,
        bathrooms: 3,
        areaSqm: 180.0,
        code: 'PROP-KLCC-001',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 3.1578,
        longitude: 101.7118,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Luxury living room
          'https://images.unsplash.com/photo-1560449752-6bb5e20a4e36?w=800', // Modern bedroom
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800', // Kitchen view
          'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800', // Bathroom
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'  // City skyline view
        ]
      },
      {
        title: 'Modern Apartment in George Town',
        description: 'Beautifully renovated 2-bedroom apartment in heritage area with modern amenities. Walking distance to UNESCO World Heritage sites and local eateries.',
        address: 'Lebuh Armenian, George Town',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10200',
        price: 2200.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 95.0,
        code: 'PROP-PG-002',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4164,
        longitude: 100.3327,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', // Heritage apartment living
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', // Modern interior
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Bedroom design
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Kitchen area
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800'  // Heritage street view
        ]
      },
      {
        title: 'Cozy Studio at Mont Kiara',
        description: 'Perfect for young professionals. Fully furnished studio apartment with modern amenities, gym, and swimming pool access.',
        address: 'Jalan Kiara, Mont Kiara',
        city: 'Kuala Lumpur',
        state: 'Selangor',
        zipCode: '50480',
        price: 1800.00,
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: 45.0,
        code: 'PROP-MK-003',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 3.1725,
        longitude: 101.6520,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', // Cozy studio
          'https://images.unsplash.com/photo-1631889993959-41b4e9b69dde?w=800', // Modern compact living
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', // Studio kitchen
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800', // Compact bathroom
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'  // Mont Kiara area view
        ]
      },
      {
        title: 'Spacious Family Home in Subang Jaya',
        description: '4-bedroom double-storey terrace house perfect for families. Near schools, shopping malls, and public transport.',
        address: 'SS15/4, Subang Jaya',
        city: 'Subang Jaya',
        state: 'Selangor',
        zipCode: '47500',
        price: 3200.00,
        bedrooms: 4,
        bathrooms: 3,
        areaSqm: 220.0,
        code: 'PROP-SJ-004',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: false,
        latitude: 3.0436,
        longitude: 101.5870,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', // Family house exterior
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Living room
          'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', // Master bedroom
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Family kitchen
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'  // Garden/backyard
        ]
      },
      {
        title: 'Beachfront Condo in Gurney Bay',
        description: 'Wake up to stunning sea views every morning! 2-bedroom beachfront condominium with direct beach access and resort-style facilities.',
        address: 'Persiaran Gurney, Gurney Bay',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10250',
        price: 4500.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 120.0,
        code: 'PROP-GB-005',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4370,
        longitude: 100.3090,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Beachfront condo
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', // Ocean view
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', // Beach bedroom
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Living area
          'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'  // Balcony sea view
        ]
      },
      {
        title: 'Executive Apartment in Bangsar',
        description: 'Premium 3-bedroom apartment in exclusive Bangsar area. Close to embassies, international schools, and trendy cafes.',
        address: 'Jalan Bangsar, Bangsar',
        city: 'Kuala Lumpur',
        state: 'Kuala Lumpur',
        zipCode: '59000',
        price: 5200.00,
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 140.0,
        code: 'PROP-BS-006',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 3.1319,
        longitude: 101.6841,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', // Executive apartment
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', // Premium interior
          'https://images.unsplash.com/photo-1560449752-6bb5e20a4e36?w=800', // Master bedroom
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800', // Modern kitchen
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'  // Bangsar city view
        ]
      },
      {
        title: 'Budget-Friendly Room in Puchong',
        description: 'Affordable single room in shared apartment. Perfect for students and young working adults. Includes utilities and WiFi.',
        address: 'Jalan Puchong, Puchong',
        city: 'Puchong',
        state: 'Selangor',
        zipCode: '47100',
        price: 650.00,
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: 25.0,
        code: 'PROP-PC-007',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 3.0269,
        longitude: 101.6050,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800', // Budget room
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', // Compact living
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', // Small kitchen
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800', // Bathroom
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'  // Puchong area
        ]
      },
      {
        title: 'Luxury Villa in Damansara Heights',
        description: 'Exclusive 5-bedroom villa with private pool and garden. Premium location with 24-hour security and panoramic city views.',
        address: 'Jalan Semantan, Damansara Heights',
        city: 'Kuala Lumpur',
        state: 'Kuala Lumpur',
        zipCode: '50490',
        price: 12000.00,
        bedrooms: 5,
        bathrooms: 4,
        areaSqm: 350.0,
        code: 'PROP-DH-008',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 3.1516,
        longitude: 101.6650,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', // Luxury villa exterior
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', // Villa interior
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Master suite
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Living area
          'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800'  // Private pool
        ]
      },
      {
        title: 'Serviced Apartment in Cyberjaya',
        description: 'Modern 2-bedroom serviced apartment in tech hub Cyberjaya. High-speed internet, gym, and business center facilities.',
        address: 'Persiaran APEC, Cyberjaya',
        city: 'Cyberjaya',
        state: 'Selangor',
        zipCode: '63000',
        price: 2800.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 85.0,
        code: 'PROP-CJ-009',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 2.9213,
        longitude: 101.6559,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', // Serviced apartment
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Modern living
          'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', // Tech-style bedroom
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800', // Smart kitchen
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800'  // Cyberjaya tech hub
        ]
      },
      {
        title: 'Historic Shophouse in Malacca',
        description: 'Beautifully restored 3-story shophouse in UNESCO World Heritage area. Perfect for Airbnb or boutique business.',
        address: 'Jalan Hang Jebat, Malacca',
        city: 'Malacca',
        state: 'Malacca',
        zipCode: '75200',
        price: 3500.00,
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 160.0,
        code: 'PROP-ML-010',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: false,
        latitude: 2.1951,
        longitude: 102.2501,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Historic shophouse
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Traditional interior
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800', // Heritage street
          'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800', // Restored bathroom
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'  // Heritage kitchen
        ]
      },
      // === 15 NEW PENANG PROPERTIES ===
      {
        title: 'Seaside Luxury Condo at Tanjung Bungah',
        description: 'Premium beachfront condominium with stunning sea views. Features infinity pool, private beach access, and 5-star resort amenities.',
        address: 'Jalan Tanjung Bungah, Tanjung Bungah',
        city: 'Tanjung Bungah',
        state: 'Penang',
        zipCode: '11200',
        price: 5800.00,
        bedrooms: 3,
        bathrooms: 3,
        areaSqm: 150.0,
        code: 'PROP-PG-011',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4665,
        longitude: 100.2794,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', // Beachfront luxury
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', // Sea view living
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Luxury interior
          'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', // Infinity pool view
          'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800'  // Private beach
        ]
      },
      {
        title: 'Heritage Townhouse in Little India',
        description: 'Authentic 2-story heritage townhouse in vibrant Little India. Walking distance to spice markets, temples, and cultural attractions.',
        address: 'Lebuh Queen, Little India',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10200',
        price: 1900.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 80.0,
        code: 'PROP-PG-012',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4141,
        longitude: 100.3315,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800', // Heritage townhouse
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', // Traditional interior
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Heritage bedroom
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Cultural kitchen
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'  // Little India street
        ]
      },
      {
        title: 'Modern Studio at Strait Quay',
        description: 'Stylish studio apartment at prestigious Strait Quay marina. Features harbor views, yacht club access, and premium dining options.',
        address: 'Jalan Seri Tanjung Pinang, Strait Quay',
        city: 'Tanjung Tokong',
        state: 'Penang',
        zipCode: '10470',
        price: 2400.00,
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: 55.0,
        code: 'PROP-PG-013',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4595,
        longitude: 100.3088,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', // Modern studio
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', // Marina view
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', // Compact kitchen
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800', // Modern bathroom
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'  // Yacht club view
        ]
      },
      {
        title: 'Family Terrace House in Jelutong',
        description: 'Spacious 3-bedroom terrace house perfect for families. Near local schools, wet markets, and traditional coffee shops.',
        address: 'Jalan Jelutong, Jelutong',
        city: 'George Town',
        state: 'Penang',
        zipCode: '11600',
        price: 1600.00,
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 110.0,
        code: 'PROP-PG-014',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: false,
        latitude: 5.3971,
        longitude: 100.3144,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', // Family terrace
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Living area
          'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', // Family bedroom
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Local kitchen
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'  // Neighborhood
        ]
      },
      {
        title: 'Penthouse at Prangin Mall Area',
        description: 'Luxurious penthouse overlooking KOMTAR and city center. Premium location with shopping mall, transport hub access.',
        address: 'Jalan Dr Lim Chwee Leong, Prangin',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10100',
        price: 4200.00,
        bedrooms: 3,
        bathrooms: 3,
        areaSqm: 135.0,
        code: 'PROP-PG-015',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4141,
        longitude: 100.3288,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', // City penthouse
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Luxury living
          'https://images.unsplash.com/photo-1560449752-6bb5e20a4e36?w=800', // Premium bedroom
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800', // Modern kitchen
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'  // KOMTAR view
        ]
      },
      {
        title: 'Cozy Apartment in Air Itam',
        description: 'Affordable 2-bedroom apartment near Kek Lok Si Temple and Penang Hill. Great for nature lovers and temple visitors.',
        address: 'Jalan Air Itam, Air Itam',
        city: 'Air Itam',
        state: 'Penang',
        zipCode: '11500',
        price: 1200.00,
        bedrooms: 2,
        bathrooms: 1,
        areaSqm: 70.0,
        code: 'PROP-PG-016',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4000,
        longitude: 100.2778,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', // Cozy apartment
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', // Simple interior
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Bedroom
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Kitchen
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800'  // Temple area
        ]
      },
      {
        title: 'Luxury Bungalow in Pulau Tikus',
        description: 'Exclusive 4-bedroom bungalow in prestigious Pulau Tikus area. Private garden, swimming pool, and premium neighborhood.',
        address: 'Jalan Burma, Pulau Tikus',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10350',
        price: 8500.00,
        bedrooms: 4,
        bathrooms: 4,
        areaSqm: 280.0,
        code: 'PROP-PG-017',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4317,
        longitude: 100.3108,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', // Luxury bungalow
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', // Premium interior
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Master suite
          'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800', // Private pool
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'  // Garden view
        ]
      },
      {
        title: 'Student-Friendly Room in USM Area',
        description: 'Budget-friendly single room near Universiti Sains Malaysia. Includes utilities, WiFi, and close to campus shuttle.',
        address: 'Jalan Sungai Dua, Minden',
        city: 'Gelugor',
        state: 'Penang',
        zipCode: '11800',
        price: 550.00,
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: 20.0,
        code: 'PROP-PG-018',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.3560,
        longitude: 100.2972,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800', // Student room
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', // Study area
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', // Simple kitchen
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800', // Basic bathroom
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'  // Campus area
        ]
      },
      {
        title: 'Waterfront Condo at Gurney Paragon',
        description: 'Premium waterfront condominium with mall integration. Direct access to Gurney Plaza and sea-facing balcony.',
        address: 'Persiaran Gurney, Gurney Bay',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10250',
        price: 6200.00,
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 140.0,
        code: 'PROP-PG-019',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4370,
        longitude: 100.3090,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', // Waterfront condo
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Premium living
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', // Sea view bedroom
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800', // Modern kitchen
          'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'  // Balcony sea view
        ]
      },
      {
        title: 'Traditional Shophouse in Chinatown',
        description: 'Authentic 2-story shophouse in historic Chinatown. Rich cultural heritage, near clan houses and traditional shops.',
        address: 'Lebuh Chulia, Chinatown',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10200',
        price: 2100.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 90.0,
        code: 'PROP-PG-020',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4148,
        longitude: 100.3320,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Traditional shophouse
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800', // Chinatown street
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Heritage interior
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Traditional kitchen
          'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800'  // Heritage bathroom
        ]
      },
      {
        title: 'Modern Condo at Queensbay Mall',
        description: 'Contemporary 2-bedroom condo connected to Queensbay Mall. Shopping, dining, and entertainment at your doorstep.',
        address: 'Persiaran Bayan Indah, Queensbay',
        city: 'Bayan Lepas',
        state: 'Penang',
        zipCode: '11900',
        price: 2800.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 85.0,
        code: 'PROP-PG-021',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.3307,
        longitude: 100.2810,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', // Modern condo
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Contemporary living
          'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', // Modern bedroom
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800', // Sleek kitchen
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'  // Mall connection
        ]
      },
      {
        title: 'Hillside Villa in Balik Pulau',
        description: 'Tranquil 3-bedroom villa surrounded by nutmeg gardens and durian orchards. Perfect escape from city life.',
        address: 'Jalan Balik Pulau, Balik Pulau',
        city: 'Balik Pulau',
        state: 'Penang',
        zipCode: '11000',
        price: 3800.00,
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 160.0,
        code: 'PROP-PG-022',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: false,
        latitude: 5.3473,
        longitude: 100.2065,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', // Hillside villa
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Rural living
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Natural bedroom
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Garden kitchen
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800'  // Orchard view
        ]
      },
      {
        title: 'Executive Suite at George Town',
        description: 'Luxury executive suite in heritage George Town. Business facilities, concierge service, and UNESCO site proximity.',
        address: 'Lebuh Farquhar, George Town',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10200',
        price: 4800.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 100.0,
        code: 'PROP-PG-023',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4198,
        longitude: 100.3345,
        ownerId: landlord.id,
        propertyTypeId: condominiumType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', // Executive suite
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', // Business interior
          'https://images.unsplash.com/photo-1560449752-6bb5e20a4e36?w=800', // Executive bedroom
          'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800', // Premium kitchen
          'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800'  // Heritage street
        ]
      },
      {
        title: 'Beach House in Batu Ferringhi',
        description: 'Spectacular 4-bedroom beach house with direct beach access. Water sports, beach bars, and sunset views.',
        address: 'Jalan Batu Ferringhi, Batu Ferringhi',
        city: 'Batu Ferringhi',
        state: 'Penang',
        zipCode: '11100',
        price: 7200.00,
        bedrooms: 4,
        bathrooms: 3,
        areaSqm: 200.0,
        code: 'PROP-PG-024',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4745,
        longitude: 100.2466,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', // Beach house
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', // Ocean front
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Beach bedroom
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // Seaside living
          'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'  // Beach sunset
        ]
      },
      {
        title: 'Garden Apartment in Botanical Gardens Area',
        description: 'Serene 2-bedroom apartment near Penang Botanic Gardens. Lush greenery, jogging trails, and peaceful environment.',
        address: 'Jalan Kebun Bunga, Botanic Gardens',
        city: 'George Town',
        state: 'Penang',
        zipCode: '10350',
        price: 2000.00,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 75.0,
        code: 'PROP-PG-025',
        country: 'MY',
        currencyCode: 'MYR',
        furnished: true,
        latitude: 5.4317,
        longitude: 100.2944,
        ownerId: landlord.id,
        propertyTypeId: apartmentType.id,
        status: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', // Garden apartment
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Nature living
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', // Green bedroom
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', // Garden kitchen
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'  // Botanic view
        ]
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const propertyData of properties) {
      try {
        // Check if property already exists
        const existingProperty = await prisma.property.findUnique({
          where: { code: propertyData.code }
        });

        if (existingProperty) {
          console.log(`⏭️  Property "${propertyData.code}" already exists, skipping...`);
          skippedCount++;
          continue;
        }

        const property = await prisma.property.create({
          data: propertyData,
          include: {
            propertyType: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        // Add some amenities to the property
        if (amenities.length > 0) {
          const propertyAmenities = amenities.slice(0, 3).map(amenity => ({
            propertyId: property.id,
            amenityId: amenity.id
          }));

          await prisma.propertyAmenity.createMany({
            data: propertyAmenities,
            skipDuplicates: true
          });
        }

        console.log(`✅ Created property: ${property.title} in ${property.city}, ${property.state}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating property "${propertyData.title}":`, error.message);
      }
    }

    console.log('\n📊 Properties Seeding Summary:');
    console.log(`✅ Successfully created: ${createdCount} properties`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} properties`);

    // Show property statistics
    const totalProperties = await prisma.property.count();
    const propertiesByState = await prisma.property.groupBy({
      by: ['state'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    console.log('\n🏠 Properties Statistics:');
    console.log(`   Total properties: ${totalProperties}`);
    console.log('   Properties by state:');
    
    for (const stateData of propertiesByState) {
      console.log(`     ${stateData.state}: ${stateData._count.id} properties`);
    }

    return { success: true, created: createdCount };

  } catch (error) {
    console.error('❌ Error during properties seeding:', error);
    throw error;
  }
}

// Function to clean up properties
async function cleanupProperties() {
  console.log('🧹 Cleaning up existing properties...');
  
  try {
    // Delete property amenities first due to foreign key constraints
    await prisma.propertyAmenity.deleteMany({});
    
    // Then delete properties
    const deleted = await prisma.property.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.count} properties`);
    return deleted.count;
  } catch (error) {
    console.error('❌ Error cleaning up properties:', error);
    throw error;
  }
}

module.exports = {
  seedProperties,
  cleanupProperties
};

// Allow direct execution
if (require.main === module) {
  async function main() {
    try {
      await seedProperties();
    } catch (error) {
      console.error('❌ Properties seeding failed:', error);
      process.exit(1);
    }
  }

  main();
}
