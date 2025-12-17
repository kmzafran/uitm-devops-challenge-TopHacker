const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

const prisma = new PrismaClient()

// Malaysian state coordinates for approximate marker placement
const STATE_COORDINATES = {
  'Penang': { lat: 5.4164, lng: 100.3327 },
  'Selangor': { lat: 3.0738, lng: 101.5183 },
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'Johor': { lat: 1.4854, lng: 103.7618 },
  'Perak': { lat: 4.5921, lng: 101.0901 },
  'Kedah': { lat: 6.1254, lng: 100.3673 },
  'Kelantan': { lat: 6.1254, lng: 102.2386 },
  'Terengganu': { lat: 5.3117, lng: 103.1324 },
  'Pahang': { lat: 3.8126, lng: 103.3256 },
  'Negeri Sembilan': { lat: 2.7258, lng: 101.9424 },
  'Melaka': { lat: 2.1896, lng: 102.2501 },
  'Sabah': { lat: 5.9788, lng: 116.0753 },
  'Sarawak': { lat: 1.5533, lng: 110.3592 },
  'Putrajaya': { lat: 2.9264, lng: 101.6964 },
  'Labuan': { lat: 5.2831, lng: 115.2308 },
  'Perlis': { lat: 6.4449, lng: 100.1983 },
}

// Get approximate coordinates from location string
function getApproximateCoordinates(location) {
  if (!location) return { lat: null, lng: null }

  const locationLower = location.toLowerCase()

  for (const [state, coords] of Object.entries(STATE_COORDINATES)) {
    if (locationLower.includes(state.toLowerCase())) {
      // Add small random offset to avoid all markers stacking
      const latOffset = (Math.random() - 0.5) * 0.1
      const lngOffset = (Math.random() - 0.5) * 0.1
      return {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset
      }
    }
  }

  // Default to Kuala Lumpur if no state matches
  return { lat: 3.1390 + (Math.random() - 0.5) * 0.1, lng: 101.6869 + (Math.random() - 0.5) * 0.1 }
}

async function importProperties() {
  try {
    console.log('Starting property import with proper CSV parsing...')

    // First, create a default owner user for all scraped properties
    let defaultOwner = await prisma.user.findFirst({
      where: { email: 'scraper@rentverse.my' }
    })

    if (!defaultOwner) {
      defaultOwner = await prisma.user.create({
        data: {
          email: 'scraper@rentverse.my',
          name: 'Scraped Properties',
          password: 'default-password',
          role: 'USER'
        }
      })
      console.log('Created default owner user')
    }

    // Get or create default property type
    let defaultPropertyType = await prisma.propertyType.findFirst({
      where: { code: 'APARTMENT' }
    })

    if (!defaultPropertyType) {
      defaultPropertyType = await prisma.propertyType.create({
        data: {
          code: 'APARTMENT',
          name: 'Apartment',
          description: 'Default property type for scraped data'
        }
      })
      console.log('Created default property type')
    }

    // Delete existing scraped properties before re-import
    console.log('Cleaning up existing scraped properties...')
    const deleteResult = await prisma.property.deleteMany({
      where: { ownerId: defaultOwner.id }
    })
    console.log(`Deleted ${deleteResult.count} existing properties`)

    // Read and parse CSV file properly
    const csvPath = path.join(__dirname, '../../../rentverse-datasets/rentals.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    // Use csv-parse to properly handle multi-line fields
    const records = parse(csvContent, {
      columns: true,           // Use first row as headers
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true
    })

    console.log(`Found ${records.length} properties to import`)

    // Import in batches of 50
    const batchSize = 50
    let importedCount = 0
    let skippedCount = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)

      for (const row of batch) {
        try {
          // Parse location to extract city and state
          const location = row.location || ''
          const locationParts = location.split(', ')
          const city = locationParts[locationParts.length - 2] || locationParts[0] || location
          const state = locationParts[locationParts.length - 1] || ''

          // Parse price (remove RM prefix)
          const priceStr = row.price || 'RM0'
          const priceValue = parseFloat(priceStr.replace(/[RM,\s]/g, '')) || 0

          // Parse area (convert sqft to sqm if needed)
          let areaSqm = null
          const areaStr = row.area || ''
          const areaMatch = areaStr.match(/(\d+(?:\.\d+)?)/)
          if (areaMatch) {
            const areaSqft = parseFloat(areaMatch[1])
            areaSqm = areaSqft * 0.092903 // Convert sqft to sqm
          }

          // Parse bedrooms and bathrooms
          const bedrooms = parseInt(row.bedrooms) || 0
          const bathrooms = parseInt(row.bathrooms) || 0

          // Parse images - split by comma
          const imagesStr = row.images || ''
          const images = imagesStr
            .split(',')
            .map(img => img.trim())
            .filter(img => img.startsWith('http'))

          // Parse furnished status
          const furnishedStr = (row.furnished || '').toLowerCase()
          const furnished = furnishedStr.includes('fully') || furnishedStr.includes('partial')

          // Get approximate coordinates from location
          const coords = getApproximateCoordinates(location)

          await prisma.property.create({
            data: {
              code: row.listing_id || `SCRAPED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: row.title || 'Untitled Property',
              description: row.description || '',
              address: location,
              city: city,
              state: state,
              zipCode: '',
              price: priceValue,
              bedrooms: bedrooms,
              bathrooms: bathrooms,
              areaSqm: areaSqm,
              furnished: furnished,
              images: images,
              latitude: coords.lat,
              longitude: coords.lng,
              ownerId: defaultOwner.id,
              propertyTypeId: defaultPropertyType.id,
              status: 'APPROVED',
              isAvailable: true
            }
          })
          importedCount++
        } catch (error) {
          if (error.code === 'P2002') {
            // Unique constraint violation (property already exists)
            skippedCount++
          } else {
            console.error('Error importing property:', row.listing_id, error.message)
            skippedCount++
          }
        }
      }

      console.log(`Progress: ${Math.min(i + batchSize, records.length)}/${records.length} (${importedCount} imported, ${skippedCount} skipped)`)
    }

    console.log('\n✅ Import completed!')
    console.log(`Total imported: ${importedCount}`)
    console.log(`Total skipped: ${skippedCount}`)

  } catch (error) {
    console.error('Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run import
importProperties()
  .then(() => {
    console.log('Import script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })