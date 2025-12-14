const { prisma } = require('../../config/database');

class PropertyViewsRepository {
  /**
   * Log property view
   * @param {Object} viewData - View data
   * @param {string} viewData.propertyId - Property ID
   * @param {string} [viewData.userId] - User ID (optional for guests)
   * @param {string} [viewData.ipAddress] - IP address
   * @param {string} [viewData.userAgent] - User agent
   * @returns {Promise<Object>} Created view record
   */
  async logView({
    propertyId,
    userId = null,
    ipAddress = null,
    userAgent = null,
  }) {
    return await prisma.propertyView.create({
      data: {
        propertyId,
        userId,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get view count for a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<number>} View count
   */
  async getViewCount(propertyId) {
    return await prisma.propertyView.count({
      where: {
        propertyId,
      },
    });
  }

  /**
   * Get view count for multiple properties
   * @param {string[]} propertyIds - Array of property IDs
   * @returns {Promise<Object>} Object with property ID as key and view count as value
   */
  async getViewCounts(propertyIds) {
    const viewCounts = await prisma.propertyView.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: {
          in: propertyIds,
        },
      },
      _count: {
        id: true,
      },
    });

    // Convert to object format for easier access
    const result = {};
    propertyIds.forEach(id => {
      result[id] = 0; // Default to 0 if no views
    });

    viewCounts.forEach(item => {
      result[item.propertyId] = item._count.id;
    });

    return result;
  }

  /**
   * Get property views with pagination and filters
   * @param {Object} options - Query options
   * @param {string} options.propertyId - Property ID
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=50] - Items per page
   * @param {Date} [options.fromDate] - Filter views from date
   * @param {Date} [options.toDate] - Filter views to date
   * @returns {Promise<Object>} Views with pagination
   */
  async getPropertyViews({
    propertyId,
    page = 1,
    limit = 50,
    fromDate = null,
    toDate = null,
  }) {
    const skip = (page - 1) * limit;

    const where = {
      propertyId,
    };

    if (fromDate || toDate) {
      where.viewedAt = {};
      if (fromDate) where.viewedAt.gte = fromDate;
      if (toDate) where.viewedAt.lte = toDate;
    }

    const [views, total] = await Promise.all([
      prisma.propertyView.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
        orderBy: {
          viewedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.propertyView.count({ where }),
    ]);

    return {
      views,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get view statistics for a property
   * @param {string} propertyId - Property ID
   * @param {number} [days=30] - Number of days to look back
   * @returns {Promise<Object>} View statistics
   */
  async getViewStats(propertyId, days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [totalViews, recentViews, uniqueViewers] = await Promise.all([
      // Total views all time
      prisma.propertyView.count({
        where: { propertyId },
      }),

      // Views in the last N days
      prisma.propertyView.count({
        where: {
          propertyId,
          viewedAt: {
            gte: fromDate,
          },
        },
      }),

      // Unique viewers (registered users only)
      prisma.propertyView.findMany({
        where: {
          propertyId,
          userId: {
            not: null,
          },
        },
        distinct: ['userId'],
        select: {
          userId: true,
        },
      }),
    ]);

    return {
      totalViews,
      recentViews: {
        count: recentViews,
        period: `${days} days`,
      },
      uniqueViewers: uniqueViewers.length,
    };
  }

  /**
   * Check if user has viewed property recently (to prevent spam)
   * @param {string} propertyId - Property ID
   * @param {string} [userId] - User ID
   * @param {string} [ipAddress] - IP address
   * @param {number} [minutes=5] - Minutes to check
   * @returns {Promise<boolean>} True if viewed recently
   */
  async hasRecentView(
    propertyId,
    userId = null,
    ipAddress = null,
    minutes = 5
  ) {
    const fromTime = new Date();
    fromTime.setMinutes(fromTime.getMinutes() - minutes);

    const where = {
      propertyId,
      viewedAt: {
        gte: fromTime,
      },
    };

    if (userId) {
      where.userId = userId;
    } else if (ipAddress) {
      where.ipAddress = ipAddress;
      where.userId = null;
    } else {
      return false; // No identifier to check
    }

    const recentView = await prisma.propertyView.findFirst({
      where,
    });

    return !!recentView;
  }

  // ==================== RATING METHODS ====================

  /**
   * Create or update property rating
   * @param {Object} ratingData - Rating data
   * @param {string} ratingData.propertyId - Property ID
   * @param {string} ratingData.userId - User ID (required for ratings)
   * @param {number} ratingData.rating - Rating (1-5)
   * @param {string} [ratingData.comment] - Optional comment
   * @returns {Promise<Object>} Created/updated rating record
   */
  async createOrUpdateRating({ propertyId, userId, rating, comment = null }) {
    return await prisma.propertyRating.upsert({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
      update: {
        rating,
        comment,
        updatedAt: new Date(),
      },
      create: {
        propertyId,
        userId,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get property ratings with pagination
   * @param {Object} options - Query options
   * @param {string} options.propertyId - Property ID
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @returns {Promise<Object>} Ratings with pagination
   */
  async getPropertyRatings({ propertyId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      prisma.propertyRating.findMany({
        where: { propertyId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
        orderBy: {
          ratedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.propertyRating.count({ where: { propertyId } }),
    ]);

    return {
      ratings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's rating for a property
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User's rating or null
   */
  async getUserRating(propertyId, userId) {
    return await prisma.propertyRating.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete user's rating
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted rating
   */
  async deleteRating(propertyId, userId) {
    return await prisma.propertyRating.delete({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });
  }

  /**
   * Get rating statistics for a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Rating statistics
   */
  async getRatingStats(propertyId) {
    const ratings = await prisma.propertyRating.findMany({
      where: { propertyId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };
    }

    const totalRatings = ratings.length;
    const sumRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((sumRating / totalRatings) * 10) / 10; // Round to 1 decimal

    // Count distribution of ratings
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    return {
      averageRating,
      totalRatings,
      ratingDistribution,
    };
  }

  /**
   * Get rating statistics for multiple properties
   * @param {string[]} propertyIds - Array of property IDs
   * @returns {Promise<Object>} Object with property ID as key and rating stats as value
   */
  async getRatingStatsMultiple(propertyIds) {
    const ratingsData = await prisma.propertyRating.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      select: {
        propertyId: true,
        rating: true,
      },
    });

    // Group by property ID
    const groupedRatings = {};
    ratingsData.forEach(rating => {
      if (!groupedRatings[rating.propertyId]) {
        groupedRatings[rating.propertyId] = [];
      }
      groupedRatings[rating.propertyId].push(rating.rating);
    });

    // Calculate stats for each property
    const result = {};
    propertyIds.forEach(propertyId => {
      const ratings = groupedRatings[propertyId] || [];

      if (ratings.length === 0) {
        result[propertyId] = {
          averageRating: 0,
          totalRatings: 0,
        };
      } else {
        const totalRatings = ratings.length;
        const sumRating = ratings.reduce((sum, r) => sum + r, 0);
        const averageRating = Math.round((sumRating / totalRatings) * 10) / 10;

        result[propertyId] = {
          averageRating,
          totalRatings,
        };
      }
    });

    return result;
  }

  // ==================== FAVORITE METHODS ====================

  /**
   * Add property to user's favorites
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created favorite record
   */
  async addToFavorites(propertyId, userId) {
    return await prisma.propertyFavorite.create({
      data: {
        propertyId,
        userId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });
  }

  /**
   * Remove property from user's favorites
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted favorite record
   */
  async removeFromFavorites(propertyId, userId) {
    return await prisma.propertyFavorite.delete({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });
  }

  /**
   * Check if property is in user's favorites
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if property is favorited
   */
  async isFavorited(propertyId, userId) {
    const favorite = await prisma.propertyFavorite.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });
    return !!favorite;
  }

  /**
   * Check favorite status for multiple properties
   * @param {string[]} propertyIds - Array of property IDs
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Object with property ID as key and boolean as value
   */
  async getFavoriteStatus(propertyIds, userId) {
    const favorites = await prisma.propertyFavorite.findMany({
      where: {
        propertyId: { in: propertyIds },
        userId,
      },
      select: {
        propertyId: true,
      },
    });

    const result = {};
    propertyIds.forEach(id => {
      result[id] = false; // Default to false
    });

    favorites.forEach(fav => {
      result[fav.propertyId] = true;
    });

    return result;
  }

  /**
   * Get user's favorite properties with pagination
   * @param {Object} options - Query options
   * @param {string} options.userId - User ID
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @returns {Promise<Object>} Favorite properties with pagination
   */
  async getUserFavorites({ userId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.propertyFavorite.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              propertyType: true,
              owner: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  name: true,
                },
              },
              amenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
        },
        orderBy: {
          favoritedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.propertyFavorite.count({ where: { userId } }),
    ]);

    return {
      favorites: favorites.map(fav => ({
        favoritedAt: fav.favoritedAt,
        property: fav.property,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get favorite count for a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<number>} Favorite count
   */
  async getFavoriteCount(propertyId) {
    return await prisma.propertyFavorite.count({
      where: { propertyId },
    });
  }

  /**
   * Get favorite counts for multiple properties
   * @param {string[]} propertyIds - Array of property IDs
   * @returns {Promise<Object>} Object with property ID as key and count as value
   */
  async getFavoriteCounts(propertyIds) {
    const favoriteCounts = await prisma.propertyFavorite.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: {
          in: propertyIds,
        },
      },
      _count: {
        id: true,
      },
    });

    // Convert to object format for easier access
    const result = {};
    propertyIds.forEach(id => {
      result[id] = 0; // Default to 0 if no favorites
    });

    favoriteCounts.forEach(item => {
      result[item.propertyId] = item._count.id;
    });

    return result;
  }

  /**
   * Get users who favorited a property
   * @param {string} propertyId - Property ID
   * @param {Object} [options={}] - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Object>} Users who favorited with pagination
   */
  async getPropertyFavoriters(propertyId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.propertyFavorite.findMany({
        where: { propertyId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
        orderBy: {
          favoritedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.propertyFavorite.count({ where: { propertyId } }),
    ]);

    return {
      favoriters: favorites.map(fav => ({
        favoritedAt: fav.favoritedAt,
        user: fav.user,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get recent users who favorited a property (for stats)
   * @param {string} propertyId - Property ID
   * @param {number} [limit=10] - Number of recent favorites to return
   * @returns {Promise<Array>} Recent favorites with limited user info
   */
  async getRecentFavorites(propertyId, limit = 10) {
    const recentFavorites = await prisma.propertyFavorite.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        favoritedAt: 'desc',
      },
      take: limit,
    });

    return recentFavorites.map(fav => ({
      userId: fav.userId,
      username:
        fav.user.name || `${fav.user.firstName} ${fav.user.lastName}`.trim(),
      createdAt: fav.favoritedAt,
    }));
  }
}

module.exports = PropertyViewsRepository;
