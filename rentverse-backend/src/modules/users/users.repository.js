const { prisma } = require('../../config/database');

class UsersRepository {
  async findMany(options = {}) {
    const {
      where = {},
      skip = 0,
      take = 10,
      orderBy = { createdAt: 'desc' },
    } = options;

    return await prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        dateOfBirth: true,
        phone: true,
        profilePicture: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy,
    });
  }

  async count(where = {}) {
    return await prisma.user.count({ where });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        dateOfBirth: true,
        phone: true,
        profilePicture: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async create(userData) {
    // Compute name from firstName and lastName
    const computedName =
      `${userData.firstName || ''} ${userData.lastName || ''}`.trim();

    return await prisma.user.create({
      data: {
        ...userData,
        name: computedName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        dateOfBirth: true,
        phone: true,
        profilePicture: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id, updateData) {
    // Compute name from firstName and lastName if either is being updated
    const dataToUpdate = { ...updateData };
    if (
      updateData.firstName !== undefined ||
      updateData.lastName !== undefined
    ) {
      // Get current user data to have complete firstName and lastName
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { firstName: true, lastName: true },
      });

      const firstName =
        updateData.firstName !== undefined
          ? updateData.firstName
          : currentUser?.firstName || '';
      const lastName =
        updateData.lastName !== undefined
          ? updateData.lastName
          : currentUser?.lastName || '';
      dataToUpdate.name = `${firstName} ${lastName}`.trim();
    }

    return await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        dateOfBirth: true,
        phone: true,
        profilePicture: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }
}

module.exports = new UsersRepository();
