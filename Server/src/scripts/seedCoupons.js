import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../Model/Coupon.js';

// Load environment variables
dotenv.config({ path: ".env" });

// Connect to MongoDB
mongoose.connect(process.env.MONGOOSE_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample coupon data
const sampleCoupons = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrder: 100000,
    maxDiscount: 50000,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    usageLimit: 100,
    used: 0,
    isActive: true,
    description: 'Giảm 10% cho khách hàng mới'
  },
  {
    code: 'FREESHIP',
    type: 'fixed',
    value: 30000,
    minOrder: 200000,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    usageLimit: null, // Unlimited usage
    used: 0,
    isActive: true,
    description: 'Miễn phí vận chuyển'
  },
  {
    code: 'SUMMER25',
    type: 'percentage',
    value: 25,
    minOrder: 300000,
    maxDiscount: 150000,
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    usageLimit: 50,
    used: 0,
    isActive: true,
    description: 'Khuyến mãi mùa hè'
  }
];

// Seed function
const seedCoupons = async () => {
  try {
    // Delete existing coupons first (optional)
    await Coupon.deleteMany({});
    console.log('Existing coupons deleted');
    
    // Insert sample coupons
    const result = await Coupon.insertMany(sampleCoupons);
    console.log(`${result.length} coupons inserted successfully`);
    
    // Display the inserted coupons
    console.log('Inserted coupons:');
    result.forEach(coupon => {
      console.log(`- ${coupon.code}: ${coupon.type === 'percentage' ? coupon.value + '%' : coupon.value + 'đ'} off`);
    });
    
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding coupons:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedCoupons(); 