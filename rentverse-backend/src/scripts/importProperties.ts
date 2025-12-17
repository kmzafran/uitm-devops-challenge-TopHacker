import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface RentalCsvRow {
  listing_id: string
  title: string
  url: string
  price: string
  location: string
  property_type: string
  bedrooms: string
  bathrooms: string
  area: string
  furnished: string
  description: string
  images: string
  seller_name: string
  fetched_at: string
}

async function importProperties() {
  try {
    console.log('Starting property import...')

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

    // Process CSV file
    const csvPath = path.join(process.cwd(), '../datasets/rentals.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',')

    const properties: RentalCsvRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV parsing (handles basic cases)
      const values = []
      let current = ''
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      properties.push(row as RentalCsvRow)
    }

    console.log(`Found ${properties.length} properties to import`)

    // Import in batches of 50
    const batchSize = 50
    let importedCount = 0
    let skippedCount = 0

    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize)

      const propertyData = batch.map(row => {
        // Parse location to extract city and state
        const locationParts = row.location.split(', ')
        const city = locationParts[locationParts.length - 2] || row.location
        const state = locationParts[locationParts.length - 1] || ''

        // Parse price (remove RM prefix)
        const priceValue = parseFloat(row.price.replace(/[RM,\s]/g, '')) || 0

        // Parse area (convert sqft to sqm if needed)
        let areaSqm = null
        const areaMatch = row.area.match(/(\d+(?:\.\d+)?)/)
        if (areaMatch) {
          const areaSqft = parseFloat(areaMatch[1])
          areaSqm = areaSqft * 0.092903 // Convert sqft to sqm
        }

        // Parse bedrooms and bathrooms
        const bedrooms = parseInt(row.bedrooms) || 0
        const bathrooms = parseInt(row.bathrooms) || 0

        // Parse images
        const images = row.images ? row.images.split(',').map(img => img.trim()) : []

        // Parse furnished
        const furnished = row.furnished.toLowerCase().includes('fully') ||
                         row.furnished.toLowerCase().includes('partial')

        return {
          code: row.listing_id,
          title: row.title,
          description: row.description || '',
          address: row.location,
          city: city,
          state: state,
          zipCode: '',
          price: priceValue,
          bedrooms: bedrooms,
          bathrooms: bathrooms,
          areaSqm: areaSqm,
          furnished: furnished,
          images: images,
          ownerId: defaultOwner.id,
          propertyTypeId: defaultPropertyType.id,
          status: 'APPROVED' as const, // Auto-approve scraped data
          isAvailable: true
        }
      })

      // Try to create properties, skip duplicates
      for (const prop of propertyData) {
        try {
          await prisma.property.create({
            data: prop
          })
          importedCount++
        } catch (error: any) {
          if (error.code === 'P2002') {
            // Unique constraint violation (property already exists)
            skippedCount++
          } else {
            console.error('Error importing property:', prop.code, error.message)
          }
        }
      }

      console.log(`Progress: ${Math.min(i + batchSize, properties.length)}/${properties.length} (${importedCount} imported, ${skippedCount} skipped)`)
    }

    console.log('\n✅ Import completed!')
    console.log(`Total imported: ${importedCount}`)
    console.log(`Total skipped (duplicates): ${skippedCount}`)

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