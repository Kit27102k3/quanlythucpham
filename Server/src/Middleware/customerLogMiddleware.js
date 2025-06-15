import CustomerLogger from '../utils/customerLogger.js';

/**
 * Middleware to log customer authentication activities
 */
export const logAuthActivity = async (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture response
  res.end = async function(chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    
    // Get client IP address
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress;
    
    // Get path and method
    const path = req.path;
    const method = req.method;
    
    // Get user agent
    const userAgent = req.headers['user-agent'];
    
    // Check if this is an authentication route
    if (path.includes('/login') || path.includes('/auth')) {
      const user = req.user || {};
      const email = req.body && req.body.email || user.email;
      
      // Log based on response status
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await CustomerLogger.loginSuccess({
          customerId: user._id,
          email,
          ip,
          userAgent,
          sessionId: req.session && req.session.id,
          method: path.includes('google') ? 'google' : 
                  path.includes('facebook') ? 'facebook' : 'password'
        });
      } else if (res.statusCode >= 400) {
        await CustomerLogger.loginFailed({
          email,
          ip,
          userAgent,
          reason: res.statusCode === 401 ? 'invalid_credentials' : 
                  res.statusCode === 403 ? 'forbidden' : 'error',
          method: path.includes('google') ? 'google' : 
                  path.includes('facebook') ? 'facebook' : 'password'
        });
      }
    }
    
    // Check if this is a logout route
    if (path.includes('/logout')) {
      const user = req.user || {};
      await CustomerLogger.logout({
        customerId: user._id,
        email: user.email,
        ip,
        userAgent,
        sessionId: req.session && req.session.id
      });
    }
    
    // Check if this is a registration route
    if (path.includes('/register') || path.includes('/signup')) {
      const user = req.user || {};
      const email = req.body && req.body.email || user.email;
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await CustomerLogger.registration({
          customerId: user._id,
          email,
          ip,
          userAgent,
          status: 'success'
        });
      } else {
        await CustomerLogger.registration({
          email,
          ip,
          userAgent,
          status: 'failed',
          details: { reason: 'registration_error', statusCode: res.statusCode }
        });
      }
    }
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Middleware to log product view activities
 */
export const logProductView = async (req, res, next) => {
  try {
    // Check if this is a product view route
    if (req.path.includes('/products/') && req.method === 'GET') {
      const productId = req.params.id || req.params.productId;
      
      if (productId) {
        const user = req.user || {};
        
        await CustomerLogger.productView({
          customerId: user._id,
          email: user.email,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          productId,
          productName: req.product && req.product.name || 'Unknown Product'
        });
      }
    }
  } catch (error) {
    console.error('Error in logProductView middleware:', error);
    // Continue even if logging fails
  }
  
  next();
};

/**
 * Middleware to log order placement
 */
export const logOrderActivity = async (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture response
  res.end = async function(chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    
    // Check if this is an order creation route
    if ((req.path.includes('/orders') || req.path.includes('/checkout')) && 
        req.method === 'POST' && 
        res.statusCode >= 200 && 
        res.statusCode < 300) {
      
      try {
        const user = req.user || {};
        const orderData = req.body || {};
        
        await CustomerLogger.orderPlaced({
          customerId: user._id,
          email: user.email,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          orderId: res.locals.orderId || orderData.orderId,
          amount: orderData.totalAmount,
          items: orderData.items || []
        });
      } catch (error) {
        console.error('Error logging order activity:', error);
      }
    }
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Middleware to log payment activity
 */
export const logPaymentActivity = async (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture response
  res.end = async function(chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    
    // Check if this is a payment route
    if (req.path.includes('/payment') && 
        (req.method === 'POST' || req.path.includes('/confirm'))) {
      
      try {
        const user = req.user || {};
        const paymentData = req.body || {};
        
        await CustomerLogger.payment({
          customerId: user._id,
          email: user.email,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          orderId: paymentData.orderId,
          paymentId: paymentData.paymentId || res.locals.paymentId,
          amount: paymentData.amount,
          method: paymentData.method || 'unknown',
          status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failed'
        });
      } catch (error) {
        console.error('Error logging payment activity:', error);
      }
    }
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Export a combined middleware for convenience
export const customerActivityLogger = (req, res, next) => {
  logAuthActivity(req, res, () => {
    logProductView(req, res, () => {
      logOrderActivity(req, res, () => {
        logPaymentActivity(req, res, next);
      });
    });
  });
}; 