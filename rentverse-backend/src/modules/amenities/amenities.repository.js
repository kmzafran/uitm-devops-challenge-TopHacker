const { prisma } = require('../../config/database');

class AmenitiesRepository {
  async findMany(options = {}) {
    return await prisma.amenity.findMany(options);
  }

  async findById(id) {
    return await prisma.amenity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });
  }

  async create(data) {
    return await prisma.amenity.create({
      data,
    });
  }

  async update(id, data) {
    return await prisma.amenity.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return await prisma.amenity.delete({
      where: { id },
    });
  }

  async count(options = {}) {
    return await prisma.amenity.count(options);
  }

  async findByName(name) {
    return await prisma.amenity.findUnique({
      where: { name },
    });
  }

  async getDistinctCategories() {
    const result = await prisma.amenity.findMany({
      select: { category: true },
      where: {
        category: {
          not: null,
        },
      },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return result.map(item => item.category).filter(Boolean);
  }
}

module.exports = new AmenitiesRepository();
