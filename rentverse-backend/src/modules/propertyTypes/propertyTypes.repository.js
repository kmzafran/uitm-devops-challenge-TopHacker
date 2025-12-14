const { prisma } = require('../../config/database');

class PropertyTypesRepository {
  async findMany(options = {}) {
    return await prisma.propertyType.findMany(options);
  }

  async findById(id) {
    return await prisma.propertyType.findUnique({
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
    return await prisma.propertyType.create({
      data,
    });
  }

  async update(id, data) {
    return await prisma.propertyType.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return await prisma.propertyType.delete({
      where: { id },
    });
  }

  async count(options = {}) {
    return await prisma.propertyType.count(options);
  }

  async findByCode(code) {
    return await prisma.propertyType.findUnique({
      where: { code },
    });
  }
}

module.exports = new PropertyTypesRepository();
