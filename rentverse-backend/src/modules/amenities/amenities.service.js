const amenitiesRepository = require('./amenities.repository');

class AmenitiesService {
  async getAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      amenitiesRepository.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      amenitiesRepository.count({ where: filters }),
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
    return await amenitiesRepository.findById(id);
  }

  async create(data) {
    return await amenitiesRepository.create(data);
  }

  async update(id, data) {
    const amenity = await amenitiesRepository.findById(id);
    if (!amenity) {
      return null;
    }

    return await amenitiesRepository.update(id, data);
  }

  async delete(id) {
    const amenity = await amenitiesRepository.findById(id);
    if (!amenity) {
      return false;
    }

    await amenitiesRepository.delete(id);
    return true;
  }

  async getCategories() {
    return await amenitiesRepository.getDistinctCategories();
  }
}

module.exports = new AmenitiesService();
