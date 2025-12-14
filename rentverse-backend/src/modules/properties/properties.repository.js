const { prisma } = require('../../config/database');

class PropertiesRepository {
  async findMany(options = {}) {
    const {
      where = {},
      skip = 0,
      take = 10,
      orderBy = { createdAt: 'desc' },
    } = options;

    return await prisma.property.findMany({
      where,
      skip,
      take,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy,
    });
  }

  async count(options = {}) {
    const { where = {} } = options;
    return await prisma.property.count({ where });
  }

  async findById(id) {
    return await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCode(code) {
    return await prisma.property.findUnique({
      where: { code },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async create(propertyData) {
    return await prisma.property.create({
      data: propertyData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async update(id, updateData) {
    return await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async delete(id) {
    return await prisma.property.delete({
      where: { id },
    });
  }

  async findForGeoJSON(params) {
    const {
      minLng,
      minLat,
      maxLng,
      maxLat,
      limit,
      centerLng,
      centerLat,
      query,
    } = params;

    // Build raw SQL query for maximum performance
    let sql = `
      SELECT 
        p.id,
        p.code,
        p.title,
        p.price,
        p.currency_code as "currencyCode",
        p.bedrooms,
        p.bathrooms,
        p.area_sqm as "areaSqm",
        p.city,
        p.furnished,
        p.is_available as "isAvailable",
        p.latitude,
        p.longitude,
        pt.name as "propertyType",
        CASE 
          WHEN array_length(p.images, 1) > 0 
          THEN p.images[1] 
          ELSE NULL 
        END as thumbnail
      FROM properties p
      INNER JOIN property_types pt ON p.property_type_id = pt.id
      WHERE 
        p.status = 'APPROVED' 
        AND p.is_available = true
        AND p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
        AND p.latitude BETWEEN $1 AND $3
        AND p.longitude BETWEEN $2 AND $4
    `;

    const queryParams = [minLat, minLng, maxLat, maxLng];
    let paramIndex = 5;

    // Add text search if query provided
    if (query && query.trim()) {
      sql += ` AND (
        p.title ILIKE $${paramIndex} 
        OR p.city ILIKE $${paramIndex}
        OR p.address ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${query.trim()}%`);
      paramIndex++;
    }

    // Add distance-based ordering if center coordinates provided
    if (centerLng && centerLat) {
      sql += ` ORDER BY 
        ST_Distance(
          ST_MakePoint(p.longitude, p.latitude)::geography,
          ST_MakePoint($${paramIndex}, $${paramIndex + 1})::geography
        ) ASC,
        p.price ASC
      `;
      queryParams.push(centerLng, centerLat);
    } else {
      // Default ordering by price
      sql += ` ORDER BY p.price ASC`;
    }

    sql += ` LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    try {
      const results = await prisma.$queryRawUnsafe(sql, ...queryParams);
      return results;
    } catch (error) {
      console.error('Raw query error:', error);
      // Fallback to regular Prisma query if raw query fails
      return await this.findForGeoJSONFallback({
        minLng,
        minLat,
        maxLng,
        maxLat,
        limit,
        query,
      });
    }
  }

  // Fallback method using regular Prisma query
  async findForGeoJSONFallback(params) {
    const { minLng, minLat, maxLng, maxLat, limit, query } = params;

    const where = {
      status: 'APPROVED',
      isAvailable: true,
      latitude: {
        gte: minLat,
        lte: maxLat,
        not: null,
      },
      longitude: {
        gte: minLng,
        lte: maxLng,
        not: null,
      },
    };

    // Add text search
    if (query && query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { city: { contains: query.trim(), mode: 'insensitive' } },
        { address: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    return await prisma.property.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        price: true,
        currencyCode: true,
        bedrooms: true,
        bathrooms: true,
        areaSqm: true,
        city: true,
        furnished: true,
        isAvailable: true,
        latitude: true,
        longitude: true,
        images: true,
        propertyType: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: {
        price: 'asc',
      },
    });
  }

  async codeExists(code) {
    const property = await prisma.property.findUnique({
      where: { code },
      select: { id: true },
    });
    return !!property;
  }

  async findFeaturedProperties(options = {}) {
    const { skip = 0, take = 8 } = options;

    return await prisma.property.findMany({
      where: {
        status: 'APPROVED',
        isAvailable: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take,
    });
  }

  async countFeaturedProperties() {
    return await prisma.property.count({
      where: {
        status: 'APPROVED',
        isAvailable: true,
      },
    });
  }

  // Get counts by status for a specific owner
  async getStatusCounts(ownerId) {
    const statusCounts = await prisma.property.groupBy({
      by: ['status'],
      where: {
        ownerId: ownerId,
      },
      _count: {
        status: true,
      },
    });

    // Transform to object format
    const result = {
      DRAFT: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      ARCHIVED: 0,
    };

    statusCounts.forEach(item => {
      result[item.status] = item._count.status;
    });

    return result;
  }

  // Get counts by availability for a specific owner
  async getAvailabilityCounts(ownerId) {
    const availabilityCounts = await prisma.property.groupBy({
      by: ['isAvailable'],
      where: {
        ownerId: ownerId,
      },
      _count: {
        isAvailable: true,
      },
    });

    const result = {
      available: 0,
      unavailable: 0,
    };

    availabilityCounts.forEach(item => {
      if (item.isAvailable) {
        result.available = item._count.isAvailable;
      } else {
        result.unavailable = item._count.isAvailable;
      }
    });

    return result;
  }

  // Get average rating for a property
  async getAverageRating(propertyId) {
    const result = await prisma.propertyRating.aggregate({
      where: {
        propertyId: propertyId,
      },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }
}

module.exports = new PropertiesRepository();
