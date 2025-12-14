const app = require('./src/app');
const { disconnectDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  try {
    await disconnectDB();
    console.log('👋 Database disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ===================================');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 ===================================');
  console.log('');
  console.log('📚 API Documentation:');
  console.log(`�   http://localhost:${PORT}/docs`);
  console.log('');
  console.log('🏥 Health Check:');
  console.log(`🏥   http://localhost:${PORT}/health`);
  console.log('');
  console.log('🔗 API Base URL:');
  console.log(`🔗   http://localhost:${PORT}/api`);
  console.log('');
});
