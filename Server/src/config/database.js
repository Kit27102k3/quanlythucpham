const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // Timeout sau 15 giây
      socketTimeoutMS: 45000, // Timeout cho các operations
      connectTimeoutMS: 15000, // Timeout cho initial connection
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 50,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 