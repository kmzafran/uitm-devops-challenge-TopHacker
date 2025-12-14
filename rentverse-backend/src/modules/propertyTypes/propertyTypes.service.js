const propertyTypesRepository = require('./propertyTypes.repository');

class PropertyTypesService {
  async getAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      propertyTypesRepository.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      propertyTypesRepository.count({ where: filters }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id) {
    return await propertyTypesRepository.findById(id);
  }

  async create(data) {
    return await propertyTypesRepository.create(data);
  }

  async update(id, data) {
    const propertyType = await propertyTypesRepository.findById(id);
    if (!propertyType) {
      return null;
    }

    return await propertyTypesRepository.update(id, data);
  }

  async delete(id) {
    const propertyType = await propertyTypesRepository.findById(id);
    if (!propertyType) {
      return false;
    }

    await propertyTypesRepository.delete(id);
    return true;
  }

  async getActive() {
    return await propertyTypesRepository.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new PropertyTypesService();
