// Debug route registration
// Log tất cả các routes đã đăng ký
app.use('/api', (req, res, next) => {
  console.log(`API request: ${req.method} ${req.originalUrl}`);
  next();
});

// Đăng ký các routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);  // Đảm bảo route tin nhắn đúng
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/tips', tipRoutes);
app.use('/auth', authRoutes); 