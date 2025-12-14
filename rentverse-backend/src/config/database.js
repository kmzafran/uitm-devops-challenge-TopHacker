const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client with proper configuration
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  errorFormat: 'pretty',
});

// Handle database connection
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log('👋 Database disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
};
